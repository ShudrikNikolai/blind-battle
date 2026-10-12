import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  GAME_FINISHED_EVENT,
  GAME_SOLO_FINISHED_EVENT,
  GAME_STARTED_EVENT,
} from '@/common/events/game.event';
import { EventService } from '@/infrastructure/event/event.service';
import { GameRepository, Side } from './game.repository';
import { GameEntity } from './game.entity';
import { FINISH_JOB, GAME_QUEUE, finishJobId } from '../consts';
import type {
  AnswerResultDto,
  GameDto,
  GameResultDto,
  QuestionView,
} from '../dtos/game.dto';
import {
  buildQuestionView,
  correctness,
  decideWinner,
  isComplete,
  score,
} from '../domain/game.domain';
import {
  type IQuizPort,
  QUIZ_PORT,
  QuizSummary,
} from '../../admin/ports/quiz.port';
import { STATISTIC_UPDATE_EVENT } from '@/common/events/statistic.event';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private readonly repository: GameRepository,
    @Inject(QUIZ_PORT) private readonly quizPort: IQuizPort,
    private readonly events: EventService,
    @InjectQueue(GAME_QUEUE) private readonly queue: Queue,
  ) {}

  async create(authorId: string): Promise<GameDto> {
    const quiz = await this.quizPort.getRandomPublished();
    if (!quiz) throw new NotFoundException('No published quizzes');

    const game = await this.repository.create({
      inviteToken: randomBytes(9).toString('base64url'), // /start <token>
      status: 'created',
      authorId,
      quizId: quiz.id,
      quiz: quiz.snapshot,
      authorAnswers: [],
      rivalAnswers: [],
    });
    return game.getPublic();
  }

  async listTestQuizzes(limit = 10): Promise<QuizSummary[]> {
    return this.quizPort.listForTest(limit);
  }

  async createSolo(userId: string, quizId: string): Promise<GameDto> {
    const quiz = await this.quizPort.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    const game = await this.repository.createSolo(
      userId,
      quiz.id,
      quiz.snapshot,
      randomBytes(9).toString('base64url'),
    );
    await this.scheduleFinish(game);
    return game.getPublic();
  }

  /** Соперник открыл ссылку. Здесь стартует таймер. */
  async join(inviteToken: string, userId: string): Promise<GameDto> {
    const claimed = await this.repository.claimRival(inviteToken, userId);
    const game = await this.repository.findByInviteToken(inviteToken);
    if (!game) throw new NotFoundException('Invite not found');

    if (!claimed) {
      if (game.authorId === userId) {
        throw new BadRequestException('You cannot join your own game');
      }
      if (game.rivalId === userId) return game.getPublic(); // повторный переход по ссылке
      throw new ConflictException('Game already started');
    }

    await this.scheduleFinish(game);
    this.events.emit(GAME_STARTED_EVENT, {
      gameId: game.id,
      authorId: game.authorId,
      rivalId: userId,
      deadlineAt: game.deadlineAt!.toISOString(),
    });
    return game.getPublic();
  }

  /** Текущий вопрос игрока (null, если он уже ответил на всё). */
  async getQuestion(
    gameId: string,
    userId: string,
  ): Promise<QuestionView | null> {
    const game = await this.loadPlayable(gameId, userId);
    return buildQuestionView(
      game,
      this.answersOf(game, this.sideOf(game, userId)!).length,
    );
  }

  async submitAnswer(
    gameId: string,
    userId: string,
    questionIndex: number,
    answerIndex: number,
  ): Promise<AnswerResultDto> {
    const game = await this.loadPlayable(gameId, userId);
    const side = this.sideOf(game, userId)!;

    const question = game.quiz.questions[questionIndex];
    if (
      !question ||
      !Number.isInteger(answerIndex) ||
      answerIndex < 0 ||
      answerIndex >= question.buttons.length
    ) {
      throw new BadRequestException('Invalid answer');
    }

    const accepted = await this.repository.appendAnswer(
      game.id,
      side,
      questionIndex,
      answerIndex,
    );
    const fresh = (await this.repository.findById(game.id)) ?? game;
    const answers = this.answersOf(fresh, side);

    // не приняли и индекс не сдвинулся. значит, вышло время или игра закончилась
    let finished = fresh.status === 'finished'; // TODO
    if (
      accepted &&
      isComplete(fresh.quiz, fresh.authorAnswers) &&
      isComplete(fresh.quiz, fresh.rivalAnswers)
    ) {
      finished = (await this.finish(game.id)) || finished;
    }
    const next = buildQuestionView(fresh, answers.length);
    return { accepted, next, done: next === null, finished };
  }

  /**
   * Идемпотентное завершение. Вызывается: после последнего ответа или по таймеру
   */
  async finish(gameId: string): Promise<boolean> {
    const game = await this.repository.finishWith(gameId, (g) => {
      const complete =
        isComplete(g.quiz, g.authorAnswers) &&
        isComplete(g.quiz, g.rivalAnswers);
      const expired = !!g.deadlineAt && g.deadlineAt.getTime() <= Date.now();
      if (!complete && !expired) return null;

      const authorScore = score(correctness(g.quiz, g.authorAnswers));
      if (g.mode === 'solo')
        return { authorScore, rivalScore: null, winner: null };

      const rivalScore = score(correctness(g.quiz, g.rivalAnswers));
      return {
        authorScore,
        rivalScore,
        winner: decideWinner(authorScore, rivalScore),
      };
    });
    if (!game) return false;

    // событие после коммита; ELO в MVP нет, статистику обновляют слушатели
    if (game.mode === 'solo') {
      this.events.emit(GAME_SOLO_FINISHED_EVENT, {
        gameId: game.id,
        userId: game.authorId,
        score: game.authorScore!,
        total: game.quiz.questions.length,
        answered: game.authorAnswers.length,
        correct: correctness(game.quiz, game.authorAnswers),
      });
    } else {
      const resEvent = {
        gameId: game.id,
        authorId: game.authorId,
        rivalId: game.rivalId!,
        winner: game.winner!,
        authorScore: game.authorScore!,
        rivalScore: game.rivalScore!,
        total: game.quiz.questions.length,
        authorCorrect: correctness(game.quiz, game.authorAnswers),
        rivalCorrect: correctness(game.quiz, game.rivalAnswers),
      };

      this.events.emit(GAME_FINISHED_EVENT, resEvent);
      this.events.emit(STATISTIC_UPDATE_EVENT, resEvent);
    }

    await this.queue.remove(finishJobId(game.id)).catch(() => undefined); // таймер больше не нужен
    return true;
  }

  async getResult(gameId: string, userId: string): Promise<GameResultDto> {
    const game = await this.repository.findById(gameId);
    if (!game) throw new NotFoundException('Game not found');
    const side = this.sideOf(game, userId);
    if (!side) throw new ForbiddenException();
    if (game.status !== 'finished')
      throw new ConflictException('Game is not finished yet');

    const mine = side === 'author' ? game.authorScore! : game.rivalScore!;
    const theirs = side === 'author' ? game.rivalScore! : game.authorScore!;
    return {
      gameId: game.id,
      total: game.quiz.questions.length,
      myScore: mine,
      rivalScore: theirs,
      outcome:
        game.winner === 'draw' ? 'draw' : game.winner === side ? 'win' : 'lose',
    };
  }

  private sideOf(game: GameEntity, userId: string): Side | null {
    if (game.authorId === userId) return 'author';
    if (game.rivalId === userId) return 'rival';
    return null;
  }

  private answersOf(game: GameEntity, side: Side): number[] {
    return side === 'author' ? game.authorAnswers : game.rivalAnswers;
  }

  private async loadPlayable(
    gameId: string,
    userId: string,
  ): Promise<GameEntity> {
    const game = await this.repository.findById(gameId);
    if (!game) throw new NotFoundException('Game not found');
    if (!this.sideOf(game, userId)) throw new ForbiddenException();
    if (
      game.status !== 'active' ||
      !game.deadlineAt ||
      game.deadlineAt.getTime() <= Date.now()
    ) {
      throw new ConflictException('Game is over');
    }
    return game;
  }

  private async scheduleFinish(game: GameEntity): Promise<void> {
    const delay = Math.max(game.deadlineAt!.getTime() - Date.now(), 0) + 1000; // запас на разницу часов
    try {
      await this.queue.add(
        FINISH_JOB,
        { gameId: game.id },
        {
          jobId: finishJobId(game.id),
          delay,
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (e) {
      // похуй, игру всё равно закроет крон
      this.logger.error(`scheduleFinish failed ::: ${game.id} ::: ${e}`);
    }
  }
}

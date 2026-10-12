import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  GAME_FINISHED_EVENT,
  GAME_SOLO_FINISHED_EVENT,
  GAME_STARTED_EVENT,
  type GameSoloFinishedEvent,
  type GameFinishedEvent,
  type GameStartedEvent,
} from '@/common/events/game.event';
import { UserService } from '@/modules/user/user.service';
import { GameService } from '@/modules/game/core/game.service';
import { TelegramService } from '../core/telegram.service';
import { TEXT } from '../utils/consts/texts';
import { answerKeyboard } from '../utils/keyboards/keyboards';
import {
  renderQuestion,
  renderResult,
  renderSoloResult,
} from '../utils/render';

@Injectable()
export class GameListener {
  private readonly logger = new Logger(GameListener.name);

  constructor(
    private readonly users: UserService,
    private readonly games: GameService,
    private readonly tg: TelegramService,
  ) {}

  /** Соперник принял вызов: автору приходит первый вопрос. Сопернику его отправляет сам хендлер /start. */
  @OnEvent(GAME_STARTED_EVENT)
  async onStarted(e: GameStartedEvent): Promise<void> {
    try {
      const [author, rival] = await Promise.all([
        this.users.findById(e.authorId),
        this.users.findById(e.rivalId),
      ]);
      const question = await this.games.getQuestion(e.gameId, e.authorId);
      if (!author || !question) return;

      await this.tg.send(
        author.telegramId,
        `${TEXT.rivalJoined(rival?.firstName ?? 'Соперник')}\n\n${renderQuestion(question)}`,
        { ...answerKeyboard(question) },
      );
    } catch (err) {
      this.logger.error(`onStarted failed ::: ${e.gameId} ::: ${err}`);
    }
  }

  @OnEvent(GAME_SOLO_FINISHED_EVENT)
  async onSoloFinished(e: GameSoloFinishedEvent): Promise<void> {
    try {
      const user = await this.users.findById(e.userId);
      if (user) await this.tg.send(user.telegramId, renderSoloResult(e));
    } catch (err) {
      this.logger.error(`onSoloFinished failed ::: ${e.gameId} ::: ${err}`);
    }
  }

  @OnEvent(GAME_FINISHED_EVENT)
  async onFinished(e: GameFinishedEvent): Promise<void> {
    try {
      // TODO
      const [author, rival] = await Promise.all([
        this.users.findById(e.authorId),
        this.users.findById(e.rivalId),
      ]);

      await Promise.all([
        author &&
          this.tg.send(
            author.telegramId,
            renderResult('author', e, rival?.firstName ?? 'Соперник'),
          ),
        rival &&
          this.tg.send(
            rival.telegramId,
            renderResult('rival', e, author?.firstName ?? 'Соперник'),
          ),
      ]);
    } catch (err) {
      this.logger.error(`onFinished failed ::: ${e.gameId} ::: ${err}`);
    }
  }
}

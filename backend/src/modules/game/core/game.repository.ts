import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmRepository } from '@/common';
import { GameEntity, GameWinner } from './game.entity';
import { QuizSnapshot } from '../../admin/ports/quiz.port';

export type Side = 'author' | 'rival';

export interface FinishPatch {
  authorScore: number;
  rivalScore: number | null; // у solo нет соперника
  winner: GameWinner | null;
}

@Injectable()
export class GameRepository extends TypeOrmRepository<GameEntity> {
  constructor(
    @InjectRepository(GameEntity)
    protected readonly repository: Repository<GameEntity>,
  ) {
    super(repository);
  }

  findByInviteToken(inviteToken: string): Promise<GameEntity | null> {
    return this.repository.findOne({ where: { inviteToken } });
  }

  async createSolo(
    authorId: string,
    quizId: string,
    quiz: QuizSnapshot,
    inviteToken: string,
  ): Promise<GameEntity> {
    const res = await this.repository
      .createQueryBuilder()
      .insert()
      .into(GameEntity)
      .values({
        inviteToken,
        mode: 'solo',
        status: 'active',
        authorId,
        quizId,
        quiz,
        deadlineAt: () => "now() + (CAST(:limit AS int) * interval '1 second')",
      })
      .setParameter('limit', quiz.timeLimitSec)
      .execute();
    return (await this.findById(res.identifiers[0].id as string))!;
  }

  /** Соперник занимает место. Атомарно, только если игра created, места свободны и это не автор. */
  async claimRival(inviteToken: string, rivalId: string): Promise<boolean> {
    const res = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        rivalId,
        status: 'active' as const,
        deadlineAt: () =>
          "now() + ((quiz->>'timeLimitSec')::int * interval '1 second')",
      })
      .where(
        "invite_token = :inviteToken AND status = 'created' AND rival_id IS NULL AND author_id <> :rivalId",
        { inviteToken, rivalId },
      )
      .execute();
    return res.affected === 1;
  }

  /**
   * Дописывает ответ, только если игра активна, дедлайн не прошёл
   * и это именно тот вопрос, на который игрок ещё не отвечал.
   */
  async appendAnswer(
    gameId: string,
    side: Side,
    questionIndex: number,
    answerIndex: number,
  ): Promise<boolean> {
    const column = side === 'author' ? 'author_answers' : 'rival_answers';
    const append = () => `array_append(${column}, CAST(:answer AS int))`;
    const res = await this.repository
      .createQueryBuilder()
      .update()
      .set(
        side === 'author'
          ? { authorAnswers: append }
          : { rivalAnswers: append },
      )
      .where(
        `id = :gameId AND status = 'active' AND deadline_at > now() AND cardinality(${column}) = :questionIndex`,
        { gameId, questionIndex },
      )
      .setParameter('answer', answerIndex)
      .execute();
    return res.affected === 1;
  }

  finishWith(
    gameId: string,
    compute: (game: GameEntity) => FinishPatch | null,
  ): Promise<GameEntity | null> {
    return this.repository.manager.transaction(async (m) => {
      const game = await m.findOne(GameEntity, {
        where: { id: gameId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!game || game.status !== 'active') return null;

      const patch = compute(game);
      if (!patch) return null;

      await m.update(GameEntity, gameId, {
        ...patch,
        status: 'finished' as const,
      });
      return Object.assign(game, patch, { status: 'finished' as const });
    });
  }

  async findExpiredActiveIds(limit: number): Promise<string[]> {
    const rows = await this.repository
      .createQueryBuilder('g')
      .select('g.id', 'id')
      .where("g.status = 'active' AND g.deadline_at < now()")
      .limit(limit)
      .getRawMany<{ id: string }>();
    return rows.map((r) => r.id);
  }
}

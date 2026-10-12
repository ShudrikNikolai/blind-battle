import { BaseEntity } from '@/common';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { UserEntity } from '../../user/user.entity';
import type { QuizSnapshot } from '../../admin/ports/quiz.port';
import { GameDto } from '../dtos/game.dto';

export type GameStatus = 'created' | 'active' | 'finished';
export type GameWinner = 'author' | 'rival' | 'draw';
export type GameMode = 'versus' | 'solo';

@Entity('games')
@Index(['status', 'deadlineAt'])
export class GameEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'invite_token' })
  inviteToken: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'author_id' })
  author: Relation<UserEntity>;

  @Column({ name: 'rival_id', type: 'uuid', nullable: true })
  rivalId: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'rival_id' })
  rival: Relation<UserEntity> | null;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @Column({ type: 'jsonb' })
  quiz: QuizSnapshot;

  @Column({
    name: 'deadline_at',
    type: 'timestamptz',
    nullable: true,
  })
  deadlineAt: Date | null;

  @Column({
    name: 'author_answers',
    type: 'int',
    array: true,
    default: () => "'{}'",
  })
  authorAnswers: number[];

  @Column({
    name: 'rival_answers',
    type: 'int',
    array: true,
    default: () => "'{}'",
  })
  rivalAnswers: number[];

  @Column({
    name: 'author_score',
    type: 'int',
    nullable: true,
  })
  authorScore: number | null;

  @Column({
    name: 'rival_score',
    type: 'int',
    nullable: true,
  })
  rivalScore: number | null;

  @Column({
    type: 'enum',
    enum: ['created', 'active', 'finished'],
    enumName: 'game_status_enum',
    default: 'created',
  })
  status: GameStatus;

  @Column({
    type: 'enum',
    enum: ['author', 'rival', 'draw'],
    enumName: 'game_winner_enum',
    nullable: true,
  })
  winner: GameWinner | null;

  @Column({
    type: 'enum',
    enum: ['versus', 'solo'],
    enumName: 'game_mode_enum',
    default: 'versus',
  })
  mode: GameMode;

  getPublic(): GameDto {
    return {
      id: this.id,
      status: this.status,
      inviteToken: this.inviteToken,
      authorId: this.authorId,
      rivalId: this.rivalId,
      deadlineAt: this.deadlineAt,
      questionCount: this.quiz.questions.length,
      authorScore: this.authorScore,
      rivalScore: this.rivalScore,
      winner: this.winner,
      mode: this.mode,
    };
  }
}

import type { GameMode, GameStatus, GameWinner } from '../core/game.entity';

export interface GameDto {
  id: string;
  status: GameStatus;
  inviteToken: string;
  authorId: string;
  rivalId: string | null;
  deadlineAt: Date | null;
  questionCount: number;
  authorScore: number | null;
  rivalScore: number | null;
  winner: GameWinner | null;
  mode: GameMode;
}

export interface QuestionView {
  gameId: string;
  index: number;
  total: number;
  question: string;
  buttons: string[];
  deadlineAt: Date;
}

export interface AnswerResultDto {
  accepted: boolean;
  next: QuestionView | null;
  done: boolean;
  finished: boolean;
}

export interface GameResultDto {
  gameId: string;
  total: number;
  myScore: number;
  rivalScore: number;
  outcome: 'win' | 'lose' | 'draw';
}

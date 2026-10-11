export const GAME_STARTED_EVENT = 'game.started';
export const GAME_FINISHED_EVENT = 'game.finished';
export const GAME_SOLO_FINISHED_EVENT = 'game.solo_finished';

export interface GameSoloFinishedEvent {
  gameId: string;
  userId: string;
  score: number;
  total: number;
  answered: number; // сколько вопросов успел пройти
  correct: boolean[]; // по каждому вопросу, без ответа = false
}

export interface GameStartedEvent {
  gameId: string;
  authorId: string;
  rivalId: string;
  deadlineAt: string;
}

export interface GameFinishedEvent {
  gameId: string;
  authorId: string;
  rivalId: string;
  winner: 'author' | 'rival' | 'draw';
  authorScore: number;
  rivalScore: number;
  total: number;
  authorCorrect: boolean[];
  rivalCorrect: boolean[];
}

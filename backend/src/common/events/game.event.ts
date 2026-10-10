export const GAME_STARTED_EVENT = 'game.started';
export const GAME_FINISHED_EVENT = 'game.finished';

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

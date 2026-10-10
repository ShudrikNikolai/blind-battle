export interface QuizButton {
  text: string;
  isCorrectAnswer: boolean;
}
export interface QuizQuestion {
  question: string;
  buttons: QuizButton[];
}
export interface QuizSnapshot {
  questions: QuizQuestion[];
  timeLimitSec: number;
}

export interface QuizForGame {
  id: string;
  title: string;
  snapshot: QuizSnapshot;
}

export interface IQuizPort {
  findPublishedById(id: string): Promise<QuizForGame | null>;
  getRandomPublished(): Promise<QuizForGame | null>;
  listQuizzes(cursor: string, limit: number): Promise<QuizSnapshot[] | null>;
}

export const QUIZ_PORT = Symbol('QUIZ_PORT');

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

export interface QuizSummary {
  id: string;
  title: string;
  isPublished: boolean;
}

export interface IQuizPort {
  findPublishedById(id: string): Promise<QuizForGame | null>;
  getRandomPublished(): Promise<QuizForGame | null>;
  findById(id: string): Promise<QuizForGame | null>;
  listQuizzes(cursor: string, limit: number): Promise<QuizSnapshot[] | null>;
  listForTest(limit: number): Promise<QuizSummary[]>;
}

export const QUIZ_PORT = Symbol('QUIZ_PORT');

//Контракт между game и admin
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

export interface QuizTagSummary {
  id: string;
  name: string;
}

export interface IQuizPort {
  findPublishedById(id: string): Promise<QuizForGame | null>;
  getRandomPublished(tagId?: string): Promise<QuizForGame | null>;
  findById(id: string): Promise<QuizForGame | null>;
  listForTest(limit: number): Promise<QuizSummary[]>;
  listPublishedTopics(): Promise<QuizTagSummary[]>;
}

export const QUIZ_PORT = Symbol('QUIZ_PORT');

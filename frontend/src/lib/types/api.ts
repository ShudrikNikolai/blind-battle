export type ValidationDetail = string | { field?: string; message: string; };
export type Order = 'ASC' | 'DESC';

export interface IApiError {
  details: ValidationDetail[] | unknown[];
  message: string;
}

export interface IQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: Order;
  [key: string]: unknown;
}

export interface IApiResponse<T = unknown> {
  status: number;
  data?: T;
  errors?: IApiError;
  timestamp?: string;
  query?: IQueryParams | null;
}

export interface IPaginatedResponse<T> extends Omit<IApiResponse<T>, 'data'> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    filters?: Record<string, unknown>;
    sort?: string;
  };
}

/* ---------- Admin ---------- */
export interface Admin {
  id: string;
  login: string;
}

/* ---------- Quiz ---------- */
export interface QuizButton {
  text: string;
  isCorrectAnswer: boolean;
}

export interface QuizQuestion {
  question: string;
  buttons: QuizButton[]; // 2..4
}

export interface QuizContent {
  questions: QuizQuestion[]; // 1..30
  timeLimitSec: number; // 10..3600
}

export interface Quiz {
  id: string;
  title: string;
  content: QuizContent;
  isPublished: boolean;
  createdAt: string;
}

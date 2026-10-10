type ValidationDetail = string | { field?: string; message: string };

type Data = 'data';

type Order = 'ASC' | 'DESC';

export interface IApiError {
  details: ValidationDetail[] | unknown[];
  message: string;
}

export interface IApiResponse<T = unknown> {
  status: number;
  data?: T;
  errors?: IApiError;
  timestamp?: string;
  query?: IQueryParams | null;
}

export interface IPaginatedResponse<T> extends Omit<IApiResponse<T>, Data> {
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

export interface IQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: Order;
  [key: string]: unknown;
}

export interface IRawPaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface IBaseRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findOne(options?: FindOptions<T>): Promise<T | null>;
  findMany(options?: FindOptions<T>): Promise<T[]>;

  create(data: Partial<T>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;

  count(options?: FindOptions<T>): Promise<number>;
  exists(options?: FindOptions<T>): Promise<boolean>;

  findPaginated(options: PaginationOptions<T>): Promise<PaginatedResult<T>>;

  softDelete(id: ID): Promise<boolean>;
  restore(id: ID): Promise<boolean>;
}

export interface PaginationOptions<T> extends FindOptions<T> {
  page: number;
  limit: number;
}

export interface SortOption<T> {
  field: keyof T;
  direction: 'ASC' | 'DESC';
}

export interface FindOptions<T> {
  filter?: Partial<T>;
  select?: Array<keyof T>;
  sort?: SortOption<T>[];
  relations?: string[];
}

export type CreateData<T> = Partial<T>;

export type UpdateData<T> = Partial<T>;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

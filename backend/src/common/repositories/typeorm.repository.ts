import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  FindOptionsSelect,
  FindOptionsOrder,
  FindOptionsRelations,
  QueryDeepPartialEntity,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import {
  FindOptions,
  IBaseRepository,
  PaginatedResult,
  PaginationOptions,
  SortOption,
} from '../interfaces/repository.interface';

export abstract class TypeOrmRepository<
  T extends BaseEntity,
  ID = string,
> implements IBaseRepository<T, ID> {
  constructor(protected readonly repository: Repository<T>) {}
  protected get entityName(): string {
    return this.repository.metadata.name;
  }

  protected validateId(id: ID): void {
    if (id === undefined || id === null || id === '') {
      throw new Error(`${this.entityName} ID cannot be empty`);
    }
  }

  protected validateFilter(filter?: unknown): void {
    if (
      filter !== undefined &&
      (typeof filter !== 'object' || filter === null)
    ) {
      throw new Error('Filter must be an object');
    }
  }

  async findById(id: ID): Promise<T | null> {
    this.validateId(id);
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
  }

  async findOne(options?: FindOptions<T>): Promise<T | null> {
    return this.repository.findOne(this.buildFindOptions(options));
  }

  async findMany(options?: FindOptions<T>): Promise<T[]> {
    this.validateFilter(options?.filter);
    return this.repository.find(this.buildFindOptions(options));
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as T);
    return this.repository.save(entity);
  }

  async count(options?: FindOptions<T>): Promise<number> {
    this.validateFilter(options?.filter);
    return this.repository.count(this.buildFindOptions(options));
  }

  async exists(options?: FindOptions<T>): Promise<boolean> {
    this.validateFilter(options?.filter);
    return this.repository.exists(this.buildFindOptions(options));
  }

  async update(id: ID, data: Partial<T>): Promise<T | null> {
    this.validateId(id);
    const ID = id as FindOptionsWhere<T>['id'] as string;
    const d = data as QueryDeepPartialEntity<T>;
    await this.repository.update(ID, d);
    return this.findById(id);
  }

  async delete(id: ID): Promise<boolean> {
    this.validateId(id);
    const result = await this.repository.delete(
      id as FindOptionsWhere<T>['id'] as string,
    );
    return (result.affected || 0) > 0;
  }

  async softDelete(id: ID): Promise<boolean> {
    this.validateId(id);
    const result = await this.repository.softDelete(
      id as FindOptionsWhere<T>['id'] as string,
    );
    return (result.affected || 0) > 0;
  }

  async restore(id: ID): Promise<boolean> {
    this.validateId(id);
    const result = await this.repository.restore(
      id as FindOptionsWhere<T>['id'] as string,
    );
    return (result.affected || 0) > 0;
  }

  async findPaginated(
    options: PaginationOptions<T>,
  ): Promise<PaginatedResult<T>> {
    this.validateFilter(options.filter);
    const { page, limit } = options;
    const findOptions = this.buildFindOptions(options);
    findOptions.skip = (page - 1) * limit;
    findOptions.take = limit;

    const [data, total] = await this.repository.findAndCount(findOptions);
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private buildFindOptions(options?: FindOptions<T>): FindManyOptions<T> {
    const findOptions: FindManyOptions<T> = {};

    if (options?.filter) {
      findOptions.where = options.filter as FindOptionsWhere<T>;
    }

    if (options?.select && options.select.length > 0) {
      findOptions.select = this.toSelectOptions(options.select);
    }

    if (options?.sort && options.sort.length > 0) {
      findOptions.order = this.toOrderOptions(options.sort);
    } else {
      findOptions.order = {
        createdAt: 'DESC',
      } as FindOptionsOrder<T>;
    }

    if (options?.relations && options.relations.length > 0) {
      findOptions.relations = this.toRelationsOptions(options.relations);
    }

    return findOptions;
  }

  private toSelectOptions(fields: Array<keyof T>): FindOptionsSelect<T> {
    return fields.reduce((acc, field) => {
      (acc as Record<string, boolean>)[field as string] = true;
      return acc;
    }, {} as FindOptionsSelect<T>);
  }

  private toOrderOptions(sort: SortOption<T>[]): FindOptionsOrder<T> {
    return sort.reduce((acc, { field, direction }) => {
      (acc as Record<string, 'ASC' | 'DESC'>)[field as string] = direction;
      return acc;
    }, {} as FindOptionsOrder<T>);
  }

  private toRelationsOptions(relations: string[]): FindOptionsRelations<T> {
    return relations.reduce((acc, relation) => {
      (acc as Record<string, boolean>)[relation] = true;
      return acc;
    }, {} as FindOptionsRelations<T>);
  }
}

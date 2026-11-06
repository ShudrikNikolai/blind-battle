import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { QuizTagSummary } from '@/common/contracts/quiz';
import type { IRawPaginatedResult } from '@/common';
import {
  CreateTagDto,
  ListTagQueryDto,
  TagDto,
  UpdateTagDto,
} from '../dtos/tag.dto';
import { TagEntity } from './tag.entity';
import { TagRepository } from './tag.repository';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class TagService {
  constructor(private readonly repository: TagRepository) {}

  async create(dto: CreateTagDto): Promise<TagDto> {
    const name = this.normalizeName(dto.name);
    try {
      const tag = await this.repository.create({
        name,
        isPublished: false,
      });
      return tag.getPublic();
    } catch (e) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  async list(query: ListTagQueryDto): Promise<IRawPaginatedResult<TagDto>> {
    const { data, meta } = await this.repository.findPaginated({
      page: query.page,
      limit: query.limit,
      filter:
        query.isPublished === undefined
          ? undefined
          : { isPublished: query.isPublished },
    });

    return {
      items: data.map((tag) => tag.getPublic()),
      meta: { page: meta.page, limit: meta.limit, total: meta.total },
    };
  }

  async get(id: string): Promise<TagDto> {
    const tag = await this.repository.findById(id);
    if (!tag) throw new NotFoundException('Tag not found');
    return tag.getPublic();
  }

  async update(id: string, dto: UpdateTagDto): Promise<TagDto> {
    if (dto.name === undefined) {
      throw new BadRequestException('Nothing to update');
    }
    const name = this.normalizeName(dto.name);

    try {
      const tag = await this.repository.update(id, { name });
      if (!tag) throw new NotFoundException('Tag not found');
      return tag.getPublic();
    } catch (e) {
      this.rethrowUnique(e);
      throw e;
    }
  }

  async setPublished(id: string, isPublished: boolean): Promise<TagDto> {
    const tag = await this.repository.setPublished(id, isPublished);
    if (!tag) throw new NotFoundException('Tag not found');
    return tag.getPublic();
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const deleted = await this.repository.softDeleteAndUnpublish(id);
    if (!deleted) throw new NotFoundException('Tag not found');
    return { id, deleted: true };
  }

  // Квиз можно привязать только к опубликованному и неудалённому тегу
  async assertAssignable(tagId: string): Promise<TagEntity> {
    const tag = await this.repository.findById(tagId);
    if (!tag) throw new NotFoundException('Tag not found');
    if (!tag.isPublished) {
      throw new BadRequestException('Tag is not published');
    }
    return tag;
  }

  async listTopics(): Promise<QuizTagSummary[]> {
    const tags = await this.repository.findPublishedWithQuizzes();
    return tags.map((tag) => ({ id: tag.id, name: tag.name }));
  }

  private normalizeName(raw: string): string {
    const name = raw.trim();
    if (!name) throw new BadRequestException('Tag name is required');
    return name;
  }

  private rethrowUnique(error: unknown): void {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string })?.code === UNIQUE_VIOLATION
    ) {
      throw new ConflictException('Tag name already exists');
    }
  }
}

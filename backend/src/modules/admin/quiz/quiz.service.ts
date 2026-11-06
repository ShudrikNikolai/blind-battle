import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IRawPaginatedResult } from '@/common';
import {
  type QuizForGame,
  type QuizSummary,
  type QuizTagSummary,
} from '@/common/contracts/quiz';
import {
  CreateQuizDto,
  QuizContentDto,
  QuizDto,
  UpdateQuizDto,
} from '../dtos/quiz.dto';
import { TagService } from '../tag/tag.service';
import { QuizRepository } from './quiz.repository';

@Injectable()
export class QuizService {
  constructor(
    private readonly repository: QuizRepository,
    private readonly tags: TagService,
  ) {}

  async create(adminId: string, dto: CreateQuizDto): Promise<QuizDto> {
    this.assertContent(dto.content);
    await this.tags.assertAssignable(dto.tagId);

    const quiz = await this.repository.create({
      title: dto.title,
      content: dto.content,
      adminId,
      tagId: dto.tagId,
    });
    return this.get(quiz.id);
  }

  async list(
    page: number,
    limit: number,
  ): Promise<IRawPaginatedResult<QuizDto>> {
    const { data, meta } = await this.repository.findPaginated({
      page,
      limit,
      relations: ['tag'],
    });
    return {
      items: data.map((q) => q.getPublic()),
      meta: { page: meta.page, limit: meta.limit, total: meta.total },
    };
  }

  async get(id: string): Promise<QuizDto> {
    const quiz = await this.repository.findOne({
      filter: { id },
      relations: ['tag'],
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz.getPublic();
  }

  async update(id: string, dto: UpdateQuizDto): Promise<QuizDto> {
    if (!dto.title && !dto.content && !dto.tagId) {
      throw new BadRequestException('Nothing to update');
    }
    if (dto.content) this.assertContent(dto.content);
    if (dto.tagId) await this.tags.assertAssignable(dto.tagId);

    const quiz = await this.repository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.tagId !== undefined && { tagId: dto.tagId }),
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return this.get(quiz.id);
  }

  async setPublished(id: string, isPublished: boolean): Promise<QuizDto> {
    const quiz = await this.repository.findOne({
      filter: { id },
      relations: ['tag'],
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    if (isPublished) {
      if (!quiz.tagId) {
        throw new BadRequestException('Quiz must have a tag');
      }
      await this.tags.assertAssignable(quiz.tagId);
    }

    await this.repository.update(id, { isPublished });
    return this.get(id);
  }

  async findPublishedForGame(id: string): Promise<QuizForGame | null> {
    const quiz = await this.repository.findOne({
      filter: { id, isPublished: true },
      relations: ['tag'],
    });
    if (!quiz || !quiz.tag?.isPublished) return null;
    return { id: quiz.id, title: quiz.title, snapshot: quiz.content };
  }

  async getRandomPublishedForGame(tagId?: string): Promise<QuizForGame | null> {
    const quiz = await this.repository.findRandomPublished(tagId);
    return quiz
      ? { id: quiz.id, title: quiz.title, snapshot: quiz.content }
      : null;
  }

  async listPublishedTopics(): Promise<QuizTagSummary[]> {
    return this.tags.listTopics();
  }

  async findAnyForGame(id: string): Promise<QuizForGame | null> {
    const quiz = await this.repository.findById(id);
    return quiz
      ? { id: quiz.id, title: quiz.title, snapshot: quiz.content }
      : null;
  }

  async listSummaries(limit: number): Promise<QuizSummary[]> {
    const { data } = await this.repository.findPaginated({
      page: 1,
      limit,
      select: ['id', 'title', 'isPublished'],
    });
    return data.map((q) => ({
      id: q.id,
      title: q.title,
      isPublished: q.isPublished,
    }));
  }

  private assertContent(content: QuizContentDto): void {
    content.questions.forEach((q, i) => {
      const correct = q.buttons.filter((b) => b.isCorrectAnswer).length;
      if (correct !== 1) {
        throw new BadRequestException(
          `Question ${i + 1}: exactly one correct answer required`,
        );
      }
    });
  }
}

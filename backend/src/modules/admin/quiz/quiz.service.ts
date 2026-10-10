import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IRawPaginatedResult } from '@/common';
import { QuizRepository } from './quiz.repository';
import {
  CreateQuizDto,
  QuizContentDto,
  QuizDto,
  UpdateQuizDto,
} from '../dtos/quiz.dto';
import type { QuizForGame } from '../ports/quiz.port';

@Injectable()
export class QuizService {
  constructor(private readonly repository: QuizRepository) {}

  async create(adminId: string, dto: CreateQuizDto): Promise<QuizDto> {
    this.assertContent(dto.content);
    const quiz = await this.repository.create({
      title: dto.title,
      content: dto.content,
      adminId,
    });
    return quiz.getPublic();
  }

  async list(
    page: number,
    limit: number,
  ): Promise<IRawPaginatedResult<QuizDto>> {
    const { data, meta } = await this.repository.findPaginated({ page, limit });
    return {
      items: data.map((q) => q.getPublic()),
      meta: { page: meta.page, limit: meta.limit, total: meta.total },
    };
  }

  async get(id: string): Promise<QuizDto> {
    const quiz = await this.repository.findById(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz.getPublic();
  }

  async update(id: string, dto: UpdateQuizDto): Promise<QuizDto> {
    if (!dto.title && !dto.content) {
      throw new BadRequestException('Nothing to update');
    }
    if (dto.content) this.assertContent(dto.content);
    const quiz = await this.repository.update(id, dto);
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz.getPublic();
  }

  async setPublished(id: string, isPublished: boolean): Promise<QuizDto> {
    const quiz = await this.repository.update(id, { isPublished });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz.getPublic();
  }

  async findPublishedForGame(id: string): Promise<QuizForGame | null> {
    const quiz = await this.repository.findOne({
      filter: { id, isPublished: true },
    });
    return quiz
      ? { id: quiz.id, title: quiz.title, snapshot: quiz.content }
      : null;
  }

  async getRandomPublishedForGame(): Promise<QuizForGame | null> {
    const quiz = await this.repository.findRandomPublished();
    return quiz
      ? { id: quiz.id, title: quiz.title, snapshot: quiz.content }
      : null;
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

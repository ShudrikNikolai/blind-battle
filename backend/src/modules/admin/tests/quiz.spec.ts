import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuizService } from '../quiz/quiz.service';
import type { QuizRepository } from '../quiz/quiz.repository';
import type { QuizEntity } from '../quiz/quiz.entity';
import type { QuizContentDto } from '../dtos/quiz.dto';

// content(1, 1): два вопроса, в каждом по одному верному ответу
// content(1, 0): во втором верных нет; content(2): два верных в одном вопросе
const content = (...correctPerQuestion: number[]): QuizContentDto => ({
  timeLimitSec: 60,
  questions: correctPerQuestion.map((correct, i) => ({
    question: `Q${i + 1}`,
    buttons: [0, 1, 2].map((b) => ({
      text: `A${b}`,
      isCorrectAnswer: b < correct,
    })),
  })),
});

const makeQuiz = (over: Record<string, unknown> = {}) => {
  const q = {
    id: 'quiz-1',
    title: 'Title',
    content: content(1),
    isPublished: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...over,
  };
  return {
    ...q,
    getPublic: () => ({
      id: q.id,
      title: q.title,
      content: q.content,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
    }),
  } as unknown as QuizEntity;
};

describe('QuizService', () => {
  let repo: Record<
    | 'create'
    | 'findPaginated'
    | 'findById'
    | 'update'
    | 'findOne'
    | 'findRandomPublished',
    Mock
  >;
  let service: QuizService;

  beforeEach(() => {
    repo = {
      create: vi.fn(),
      findPaginated: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      findOne: vi.fn(),
      findRandomPublished: vi.fn(),
    };
    service = new QuizService(repo as unknown as QuizRepository);
  });

  describe('create', () => {
    it('saves quiz with adminId and returns public dto', async () => {
      const c = content(1, 1);
      repo.create.mockResolvedValue(makeQuiz({ content: c }));

      const res = await service.create('admin-1', {
        title: 'Title',
        content: c,
      });

      expect(repo.create).toHaveBeenCalledWith({
        title: 'Title',
        content: c,
        adminId: 'admin-1',
      });
      expect(res.id).toBe('quiz-1');
      expect(res.isPublished).toBe(false);
    });

    it('rejects a question without a correct answer', async () => {
      await expect(
        service.create('admin-1', { title: 'T', content: content(1, 0) }),
      ).rejects.toThrow(/Question 2/);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects a question with several correct answers', async () => {
      await expect(
        service.create('admin-1', { title: 'T', content: content(2) }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('maps entities to dto and keeps meta', async () => {
      const meta = {
        page: 2,
        limit: 10,
        total: 11,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      };
      repo.findPaginated.mockResolvedValue({ data: [makeQuiz()], meta });

      const res = await service.list(2, 10);

      expect(repo.findPaginated).toHaveBeenCalledWith({ page: 2, limit: 10 });
      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('quiz-1');
      expect(res.meta).toEqual({ page: 2, limit: 10, total: 11 });
    });
  });

  describe('get', () => {
    it('returns dto', async () => {
      repo.findById.mockResolvedValue(makeQuiz());
      await expect(service.get('quiz-1')).resolves.toMatchObject({
        id: 'quiz-1',
      });
    });

    it('throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.get('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('rejects an empty patch', async () => {
      await expect(service.update('quiz-1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('validates content when it is present', async () => {
      await expect(
        service.update('quiz-1', { content: content(0) }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when quiz does not exist', async () => {
      repo.update.mockResolvedValue(null);
      await expect(
        service.update('nope', { title: 'New' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates and returns dto', async () => {
      repo.update.mockResolvedValue(makeQuiz({ title: 'New' }));

      const res = await service.update('quiz-1', { title: 'New' });

      expect(repo.update).toHaveBeenCalledWith('quiz-1', { title: 'New' });
      expect(res.title).toBe('New');
    });
  });

  describe('setPublished', () => {
    it('toggles the flag', async () => {
      repo.update.mockResolvedValue(makeQuiz({ isPublished: true }));

      const res = await service.setPublished('quiz-1', true);

      expect(repo.update).toHaveBeenCalledWith('quiz-1', { isPublished: true });
      expect(res.isPublished).toBe(true);
    });

    it('throws NotFound', async () => {
      repo.update.mockResolvedValue(null);
      await expect(service.setPublished('nope', true)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('for the game (facade API)', () => {
    it('finds only published quiz and returns snapshot with id', async () => {
      const c = content(1, 1);
      repo.findOne.mockResolvedValue(
        makeQuiz({ content: c, isPublished: true }),
      );

      const res = await service.findPublishedForGame('quiz-1');

      expect(repo.findOne).toHaveBeenCalledWith({
        filter: { id: 'quiz-1', isPublished: true },
      });
      expect(res).toEqual({ id: 'quiz-1', title: 'Title', snapshot: c });
    });

    it('returns null for unpublished or missing quiz', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findPublishedForGame('quiz-1')).resolves.toBeNull();
    });

    it('returns a random published quiz', async () => {
      const c = content(1);
      repo.findRandomPublished.mockResolvedValue(
        makeQuiz({ content: c, isPublished: true }),
      );

      await expect(service.getRandomPublishedForGame()).resolves.toEqual({
        id: 'quiz-1',
        title: 'Title',
        snapshot: c,
      });
    });

    it('returns null when there are no published quizzes', async () => {
      repo.findRandomPublished.mockResolvedValue(null);
      await expect(service.getRandomPublishedForGame()).resolves.toBeNull();
    });
  });
});

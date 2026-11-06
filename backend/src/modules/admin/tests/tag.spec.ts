import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { TagEntity } from '../tag/tag.entity';
import type { TagRepository } from '../tag/tag.repository';
import { TagService } from '../tag/tag.service';

const makeTag = (over: Record<string, unknown> = {}) => {
  const tag = {
    id: 'tag-1',
    name: 'Tag',
    isPublished: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...over,
  };
  return {
    ...tag,
    getPublic: () => ({
      id: tag.id,
      name: tag.name,
      isPublished: tag.isPublished,
      createdAt: tag.createdAt,
    }),
  } as unknown as TagEntity;
};

const duplicateError = () =>
  new QueryFailedError(
    'INSERT INTO tags',
    [],
    Object.assign(new Error('duplicate key'), { code: '23505' }),
  );

describe('TagService', () => {
  let repo: Record<
    | 'create'
    | 'findPaginated'
    | 'findById'
    | 'update'
    | 'setPublished'
    | 'softDeleteAndUnpublish'
    | 'findPublishedWithQuizzes',
    Mock
  >;
  let service: TagService;

  beforeEach(() => {
    repo = {
      create: vi.fn(),
      findPaginated: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      setPublished: vi.fn(),
      softDeleteAndUnpublish: vi.fn(),
      findPublishedWithQuizzes: vi.fn(),
    };
    service = new TagService(repo as unknown as TagRepository);
  });

  it('creates an unpublished tag', async () => {
    repo.create.mockResolvedValue(makeTag({ isPublished: false }));

    const res = await service.create({ name: 'Tag' });

    expect(repo.create).toHaveBeenCalledWith({
      name: 'Tag',
      isPublished: false,
    });
    expect(res.isPublished).toBe(false);
  });

  it('maps a duplicate name to ConflictException', async () => {
    repo.create.mockRejectedValue(duplicateError());

    await expect(service.create({ name: 'Tag' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lists tags with pagination', async () => {
    repo.findPaginated.mockResolvedValue({
      data: [makeTag()],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    const res = await service.list({ page: 1, limit: 20 });

    expect(repo.findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      filter: undefined,
    });
    expect(res.items).toHaveLength(1);
  });

  it('throws NotFound for a missing tag', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.get('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an empty update', async () => {
    await expect(service.update('tag-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('unpublishes via setPublished', async () => {
    repo.setPublished.mockResolvedValue(makeTag({ isPublished: false }));

    const res = await service.setPublished('tag-1', false);

    expect(repo.setPublished).toHaveBeenCalledWith('tag-1', false);
    expect(res.isPublished).toBe(false);
  });

  it('soft deletes and unpublishes quizzes', async () => {
    repo.softDeleteAndUnpublish.mockResolvedValue(true);

    await expect(service.remove('tag-1')).resolves.toEqual({
      id: 'tag-1',
      deleted: true,
    });
  });

  it('throws NotFound when deleting a missing tag', async () => {
    repo.softDeleteAndUnpublish.mockResolvedValue(false);
    await expect(service.remove('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('assertAssignable', () => {
    it('accepts a published tag', async () => {
      repo.findById.mockResolvedValue(makeTag());
      await expect(service.assertAssignable('tag-1')).resolves.toBeDefined();
    });

    it('rejects an unpublished tag', async () => {
      repo.findById.mockResolvedValue(makeTag({ isPublished: false }));
      await expect(service.assertAssignable('tag-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a missing tag', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.assertAssignable('tag-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  it('returns only topics with published quizzes', async () => {
    repo.findPublishedWithQuizzes.mockResolvedValue([
      makeTag({ id: 'tag-1', name: 'Programming' }),
    ]);

    await expect(service.listTopics()).resolves.toEqual([
      { id: 'tag-1', name: 'Programming' },
    ]);
  });
});

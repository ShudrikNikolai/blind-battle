import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { IQuizPort, QuizSnapshot } from '@/common/contracts/quiz';
import {
  GAME_FINISHED_EVENT,
  GAME_SOLO_FINISHED_EVENT,
  GAME_STARTED_EVENT,
} from '@/common/events/game.event';
import { STATISTIC_UPDATE_EVENT } from '@/common/events/statistic.event';
import type { EventService } from '@/infrastructure/event/event.service';
import { GameService } from '../core/game.service';
import type { GameEntity } from '../core/game.entity';
import type { GameRepository } from '../core/game.repository';

const quiz: QuizSnapshot = {
  timeLimitSec: 60,
  questions: [
    {
      question: 'Q1',
      buttons: [
        { text: 'a', isCorrectAnswer: false },
        { text: 'b', isCorrectAnswer: true },
      ],
    },
    {
      question: 'Q2',
      buttons: [
        { text: 'c', isCorrectAnswer: true },
        { text: 'd', isCorrectAnswer: false },
      ],
    },
  ],
};

const makeGame = (over: Record<string, unknown> = {}): GameEntity => {
  const base = {
    id: 'game-1',
    status: 'active',
    inviteToken: 'token1234',
    authorId: 'author',
    rivalId: 'rival',
    quizId: 'quiz-1',
    quiz,
    deadlineAt: new Date(Date.now() + 60_000),
    authorAnswers: [] as number[],
    rivalAnswers: [] as number[],
    authorScore: null,
    rivalScore: null,
    winner: null,
    mode: 'versus',
    createdAt: new Date(),
    ...over,
  };

  return {
    ...base,
    getPublic: () => ({
      id: base.id,
      status: base.status,
      inviteToken: base.inviteToken,
      authorId: base.authorId,
      rivalId: base.rivalId,
      deadlineAt: base.deadlineAt,
      questionCount: base.quiz.questions.length,
      authorScore: base.authorScore,
      rivalScore: base.rivalScore,
      winner: base.winner,
      mode: base.mode,
    }),
  } as unknown as GameEntity;
};

describe('GameService', () => {
  let repo: Record<
    | 'create'
    | 'createSolo'
    | 'claimRival'
    | 'findByInviteToken'
    | 'findById'
    | 'appendAnswer'
    | 'finishWith'
    | 'findFinishableActiveIds'
    | 'deleteAbandonedCreated',
    Mock
  >;
  let quizPort: Record<
    'getRandomPublished' | 'findById' | 'listForTest' | 'listPublishedTopics',
    Mock
  >;
  let events: { emit: Mock; emitAsync: Mock };
  let queue: { add: Mock; remove: Mock };
  let service: GameService;

  beforeEach(() => {
    repo = {
      create: vi.fn(),
      createSolo: vi.fn(),
      claimRival: vi.fn(),
      findByInviteToken: vi.fn(),
      findById: vi.fn(),
      appendAnswer: vi.fn(),
      finishWith: vi.fn(),
      findFinishableActiveIds: vi.fn(),
      deleteAbandonedCreated: vi.fn(),
    };
    quizPort = {
      getRandomPublished: vi.fn(),
      findById: vi.fn(),
      listForTest: vi.fn(),
      listPublishedTopics: vi.fn(),
    };
    events = {
      emit: vi.fn(),
      emitAsync: vi.fn().mockResolvedValue(undefined),
    };
    queue = {
      add: vi.fn().mockResolvedValue({}),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    service = new GameService(
      repo as unknown as GameRepository,
      quizPort as unknown as IQuizPort,
      events as unknown as EventService,
      queue as unknown as Queue,
    );
  });

  describe('create', () => {
    it('snapshots a random published quiz', async () => {
      quizPort.getRandomPublished.mockResolvedValue({
        id: 'quiz-1',
        title: 'Quiz',
        snapshot: quiz,
      });
      repo.create.mockResolvedValue(
        makeGame({ status: 'created', rivalId: null, deadlineAt: null }),
      );

      const res = await service.create('author');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'created',
          authorId: 'author',
          quizId: 'quiz-1',
          quiz,
          authorAnswers: [],
          rivalAnswers: [],
        }),
      );
      expect(res.questionCount).toBe(2);
      expect(res.inviteToken).toBe('token1234');
    });

    it('passes the selected topic to the quiz lookup', async () => {
      quizPort.getRandomPublished.mockResolvedValue(null);

      await expect(service.create('author', 'tag-1')).rejects.toThrow(
        'No quizzes in this topic',
      );
      expect(quizPort.getRandomPublished).toHaveBeenCalledWith('tag-1');
    });

    it('throws when there are no published quizzes', async () => {
      quizPort.getRandomPublished.mockResolvedValue(null);

      await expect(service.create('author')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lists published topics', async () => {
      const topics = [{ id: 'tag-1', name: 'Математика' }];
      quizPort.listPublishedTopics.mockResolvedValue(topics);

      await expect(service.listTopics()).resolves.toEqual(topics);
    });
  });

  describe('join', () => {
    it('claims the rival, schedules finish and emits game.started', async () => {
      const game = makeGame();
      repo.claimRival.mockResolvedValue(true);
      repo.findByInviteToken.mockResolvedValue(game);

      const res = await service.join('token1234', 'rival');

      expect(repo.claimRival).toHaveBeenCalledWith('token1234', 'rival');
      expect(queue.add).toHaveBeenCalledWith(
        'finish',
        { gameId: 'game-1' },
        expect.objectContaining({ jobId: 'finish-game-1' }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        GAME_STARTED_EVENT,
        expect.objectContaining({
          gameId: 'game-1',
          authorId: 'author',
          rivalId: 'rival',
        }),
      );
      expect(res.id).toBe('game-1');
    });

    it('rejects joining your own game', async () => {
      repo.claimRival.mockResolvedValue(false);
      repo.findByInviteToken.mockResolvedValue(
        makeGame({ authorId: 'author' }),
      );

      await expect(service.join('token1234', 'author')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('returns the same game on a repeated visit by the rival', async () => {
      repo.claimRival.mockResolvedValue(false);
      repo.findByInviteToken.mockResolvedValue(makeGame({ rivalId: 'rival' }));

      const res = await service.join('token1234', 'rival');

      expect(res.id).toBe('game-1');
      expect(events.emit).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('rejects joining an already started game', async () => {
      repo.claimRival.mockResolvedValue(false);
      repo.findByInviteToken.mockResolvedValue(makeGame({ rivalId: 'other' }));

      await expect(service.join('token1234', 'rival')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('submitAnswer', () => {
    it('finishes the game when both players answered everything', async () => {
      repo.findById
        .mockResolvedValueOnce(
          makeGame({ authorAnswers: [], rivalAnswers: [0, 0] }),
        )
        .mockResolvedValueOnce(
          makeGame({ authorAnswers: [1, 0], rivalAnswers: [0, 0] }),
        );
      repo.appendAnswer.mockResolvedValue(true);
      repo.finishWith.mockImplementation(async (_id, compute) => {
        const game = makeGame({ authorAnswers: [1, 0], rivalAnswers: [0, 0] });
        const patch = compute(game);
        return patch
          ? Object.assign(game, patch, { status: 'finished' })
          : null;
      });

      const res = await service.submitAnswer('game-1', 'author', 1, 0);

      expect(res).toEqual({
        accepted: true,
        next: null,
        done: true,
        finished: true,
      });
      expect(events.emit).toHaveBeenCalledWith(
        GAME_FINISHED_EVENT,
        expect.anything(),
      );
    });

    it('finishes when own answers are complete despite a stale rival snapshot', async () => {
      repo.findById
        .mockResolvedValueOnce(
          makeGame({ authorAnswers: [], rivalAnswers: [0] }),
        )
        .mockResolvedValueOnce(
          makeGame({ authorAnswers: [1, 0], rivalAnswers: [0] }),
        );
      repo.appendAnswer.mockResolvedValue(true);
      // В БД соперник уже ответил, но снимок `fresh` этого ещё не видел.
      repo.finishWith.mockImplementation(async (_id, compute) => {
        const game = makeGame({ authorAnswers: [1, 0], rivalAnswers: [0, 0] });
        const patch = compute(game);
        return patch
          ? Object.assign(game, patch, { status: 'finished' })
          : null;
      });

      const res = await service.submitAnswer('game-1', 'author', 1, 0);

      expect(repo.finishWith).toHaveBeenCalled();
      expect(res.finished).toBe(true);
    });

    it('does not advance on a double tap', async () => {
      repo.findById.mockResolvedValue(makeGame({ authorAnswers: [1] }));
      repo.appendAnswer.mockResolvedValue(false);

      const res = await service.submitAnswer('game-1', 'author', 1, 0);

      expect(res.accepted).toBe(false);
      expect(res.finished).toBe(false);
    });

    it('rejects an out-of-range answer', async () => {
      repo.findById.mockResolvedValue(makeGame());

      await expect(
        service.submitAnswer('game-1', 'author', 0, 9),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('finish', () => {
    it('emits game.finished + statistic update and removes the timer job', async () => {
      repo.finishWith.mockResolvedValue(
        makeGame({
          status: 'finished',
          authorAnswers: [1, 0],
          rivalAnswers: [0, 1],
          authorScore: 2,
          rivalScore: 1,
          winner: 'author',
        }),
      );

      await expect(service.finish('game-1')).resolves.toBe(true);

      expect(events.emit).toHaveBeenCalledWith(
        GAME_FINISHED_EVENT,
        expect.objectContaining({
          gameId: 'game-1',
          authorScore: 2,
          rivalScore: 1,
          winner: 'author',
        }),
      );
      expect(events.emitAsync).toHaveBeenCalledWith(
        STATISTIC_UPDATE_EVENT,
        expect.anything(),
      );
      expect(queue.remove).toHaveBeenCalledWith('finish-game-1');
    });

    it('does nothing on a repeated finish', async () => {
      repo.finishWith.mockResolvedValue(null);

      await expect(service.finish('game-1')).resolves.toBe(false);
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('finishes a solo game as soon as the author answered everything', async () => {
      repo.finishWith.mockImplementation(async (_id, compute) => {
        const game = makeGame({
          mode: 'solo',
          rivalId: null,
          authorAnswers: [1, 0],
          rivalAnswers: [],
        });
        const patch = compute(game);
        return patch
          ? Object.assign(game, patch, { status: 'finished' })
          : null;
      });

      await expect(service.finish('game-1')).resolves.toBe(true);

      expect(events.emit).toHaveBeenCalledWith(
        GAME_SOLO_FINISHED_EVENT,
        expect.objectContaining({
          gameId: 'game-1',
          userId: 'author',
          score: 2,
        }),
      );
      expect(events.emit).not.toHaveBeenCalledWith(
        GAME_FINISHED_EVENT,
        expect.anything(),
      );
    });
  });

  describe('getResult', () => {
    it('returns the outcome for each side', async () => {
      repo.findById.mockResolvedValue(
        makeGame({
          status: 'finished',
          authorScore: 2,
          rivalScore: 1,
          winner: 'author',
        }),
      );

      await expect(
        service.getResult('game-1', 'author'),
      ).resolves.toMatchObject({
        myScore: 2,
        rivalScore: 1,
        outcome: 'win',
      });
      await expect(service.getResult('game-1', 'rival')).resolves.toMatchObject(
        {
          myScore: 1,
          rivalScore: 2,
          outcome: 'lose',
        },
      );
    });

    it('rejects a game that is still running', async () => {
      repo.findById.mockResolvedValue(makeGame());

      await expect(
        service.getResult('game-1', 'author'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});

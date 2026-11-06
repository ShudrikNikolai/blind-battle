import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameRepository } from '../core/game.repository';
import type { GameService } from '../core/game.service';
import { GameScheduler } from '../tasks/game.scheduler';

const makeScheduler = () => {
  const repository = {
    findFinishableActiveIds: vi.fn().mockResolvedValue(['game-1', 'game-2']),
    deleteAbandonedCreated: vi.fn().mockResolvedValue(3),
  };
  const game = { finish: vi.fn().mockResolvedValue(true) };
  const scheduler = new GameScheduler(
    repository as unknown as GameRepository,
    game as unknown as GameService,
  );
  return { scheduler, repository, game };
};

describe('GameScheduler', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('finishes every expired or fully answered active game', async () => {
    const { scheduler, game } = makeScheduler();

    await scheduler.sweepFinishable();

    expect(game.finish).toHaveBeenCalledTimes(2);
    expect(game.finish).toHaveBeenNthCalledWith(1, 'game-1');
    expect(game.finish).toHaveBeenNthCalledWith(2, 'game-2');
  });

  it('keeps sweeping when one game fails', async () => {
    const { scheduler, game } = makeScheduler();
    game.finish.mockRejectedValueOnce(new Error('boom'));

    await expect(scheduler.sweepFinishable()).resolves.toBeUndefined();
    expect(game.finish).toHaveBeenCalledTimes(2);
  });

  it('deletes abandoned created games', async () => {
    const { scheduler, repository } = makeScheduler();

    await scheduler.cleanupAbandoned();

    expect(repository.deleteAbandonedCreated).toHaveBeenCalledOnce();
  });

  it('swallows cleanup errors', async () => {
    const { scheduler, repository } = makeScheduler();
    repository.deleteAbandonedCreated.mockRejectedValueOnce(new Error('db'));

    await expect(scheduler.cleanupAbandoned()).resolves.toBeUndefined();
  });
});

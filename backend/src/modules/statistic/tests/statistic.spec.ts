import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StatisticGameRepository } from '../game/statistic-game.repository';
import { StatisticGameService } from '../game/statistic-game.service';
import type { StatisticUserRepository } from '../user/statistic-user.repository';
import { StatisticUserService } from '../user/statistic-user.service';

describe('StatisticUserService', () => {
  const repository = {
    findByUserId: vi.fn(),
    incWins: vi.fn().mockResolvedValue(undefined),
    incLosses: vi.fn().mockResolvedValue(undefined),
    incDraws: vi.fn().mockResolvedValue(undefined),
  };
  const service = new StatisticUserService(
    repository as unknown as StatisticUserRepository,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns zeros when the user has no finished games', async () => {
    repository.findByUserId.mockResolvedValue(null);

    await expect(service.getStats('user-1')).resolves.toEqual({
      wins: 0,
      losses: 0,
      draws: 0,
    });
  });

  it('returns stored win/loss/draw counters', async () => {
    repository.findByUserId.mockResolvedValue({
      wins: 3,
      losses: 2,
      draws: 1,
    });

    await expect(service.getStats('user-1')).resolves.toEqual({
      wins: 3,
      losses: 2,
      draws: 1,
    });
  });

  it('increments wins for the winner and losses for the loser', async () => {
    await service.updateStats({
      authorId: 'author',
      rivalId: 'rival',
      winner: 'author',
    });

    expect(repository.incWins).toHaveBeenCalledWith('author');
    expect(repository.incLosses).toHaveBeenCalledWith('rival');
    expect(repository.incDraws).not.toHaveBeenCalled();
  });

  it('increments draws for both players', async () => {
    await service.updateStats({
      authorId: 'author',
      rivalId: 'rival',
      winner: 'draw',
    });

    expect(repository.incDraws).toHaveBeenCalledWith('author');
    expect(repository.incDraws).toHaveBeenCalledWith('rival');
  });

  it('does nothing for an unknown winner', async () => {
    await service.updateStats({
      authorId: 'author',
      rivalId: 'rival',
      winner: 'unknown',
    });

    expect(repository.incWins).not.toHaveBeenCalled();
    expect(repository.incLosses).not.toHaveBeenCalled();
    expect(repository.incDraws).not.toHaveBeenCalled();
  });
});

describe('StatisticGameService', () => {
  it('saves the game snapshot idempotently', async () => {
    const repository = { saveIfAbsent: vi.fn().mockResolvedValue(undefined) };
    const service = new StatisticGameService(
      repository as unknown as StatisticGameRepository,
    );

    await service.save({
      gameId: 'game-1',
      authorCorrect: [true, false],
      rivalCorrect: [false, true],
    });

    expect(repository.saveIfAbsent).toHaveBeenCalledWith({
      gameId: 'game-1',
      authorCorrect: [true, false],
      rivalCorrect: [false, true],
    });
  });
});

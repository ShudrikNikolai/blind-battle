import type { Context } from 'telegraf';
import { describe, expect, it, vi } from 'vitest';
import type { StatisticUserService } from '@/modules/statistic/user/statistic-user.service';
import type { TelegramService } from '../core/telegram.service';
import { StatsUpdate } from '../updates/stats.update';
import { TEXT } from '../utils/consts/texts';

const makeCtx = () =>
  ({ reply: vi.fn().mockResolvedValue(undefined) }) as unknown as Context;

describe('StatsUpdate', () => {
  it('renders stats for a registered user', async () => {
    const ctx = makeCtx();
    const tg = {
      isPrivate: vi.fn().mockReturnValue(true),
      requireUser: vi
        .fn()
        .mockResolvedValue({ id: 'user-1', firstName: 'Вася' }),
    };
    const stats = {
      getStats: vi.fn().mockResolvedValue({ wins: 3, losses: 2, draws: 1 }),
    };
    const update = new StatsUpdate(
      stats as unknown as StatisticUserService,
      tg as unknown as TelegramService,
    );

    await update.onStats(ctx);

    expect(stats.getStats).toHaveBeenCalledWith('user-1');
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Побед: <b>3</b>'),
      { parse_mode: 'HTML' },
    );
  });

  it('rejects non-private chats', async () => {
    const ctx = makeCtx();
    const tg = {
      isPrivate: vi.fn().mockReturnValue(false),
      requireUser: vi.fn(),
    };
    const stats = { getStats: vi.fn() };
    const update = new StatsUpdate(
      stats as unknown as StatisticUserService,
      tg as unknown as TelegramService,
    );

    await update.onStats(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(TEXT.privateOnly);
    expect(stats.getStats).not.toHaveBeenCalled();
  });

  it('does nothing when the user is not registered', async () => {
    const ctx = makeCtx();
    const tg = {
      isPrivate: vi.fn().mockReturnValue(true),
      requireUser: vi.fn().mockResolvedValue(null),
    };
    const stats = { getStats: vi.fn() };
    const update = new StatsUpdate(
      stats as unknown as StatisticUserService,
      tg as unknown as TelegramService,
    );

    await update.onStats(ctx);

    expect(stats.getStats).not.toHaveBeenCalled();
  });
});

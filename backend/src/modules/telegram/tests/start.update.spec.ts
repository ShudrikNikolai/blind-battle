import type { Context } from 'telegraf';
import { describe, expect, it, vi } from 'vitest';
import type { GameService } from '@/modules/game/core/game.service';
import type { UserService } from '@/modules/user/core/user.service';
import type { TelegramService } from '../core/telegram.service';
import { StartUpdate } from '../updates/start.update';
import { TEXT } from '../utils/consts/texts';

const question = {
  gameId: 'game-1',
  index: 0,
  total: 1,
  question: 'Question',
  buttons: ['a', 'b'],
  deadlineAt: new Date(Date.now() + 60_000),
};

const makeStartCtx = (text: string) =>
  ({
    chat: { type: 'private' },
    from: { id: 1, first_name: 'User', username: null },
    message: { text },
    reply: vi.fn().mockResolvedValue(undefined),
  }) as unknown as Context;

const makeContactCtx = () =>
  ({
    chat: { type: 'private' },
    from: { id: 1, first_name: 'User', username: null },
    message: {
      contact: { user_id: 1, phone_number: '+79990000000' },
    },
    reply: vi.fn().mockResolvedValue(undefined),
  }) as unknown as Context;

const makeUpdate = (
  userOverrides: Record<string, unknown> = {},
  gameOverrides: Record<string, unknown> = {},
) => {
  const users = {
    register: vi.fn().mockResolvedValue({
      id: 'user-1',
      isConfirmed: false,
      ...userOverrides,
    }),
    findByTelegramId: vi.fn().mockResolvedValue({
      id: 'user-1',
      isConfirmed: false,
    }),
    confirm: vi.fn().mockResolvedValue(true),
    setPendingInvite: vi.fn().mockResolvedValue(true),
    takePendingInvite: vi.fn().mockResolvedValue(null),
  };
  const games = {
    join: vi.fn().mockResolvedValue({ id: 'game-1' }),
    getQuestion: vi.fn().mockResolvedValue(question),
    ...gameOverrides,
  };
  const tg = { isPrivate: vi.fn().mockReturnValue(true) };
  const update = new StartUpdate(
    users as unknown as UserService,
    games as unknown as GameService,
    tg as unknown as TelegramService,
  );
  return { update, users, games };
};

describe('StartUpdate pending invite', () => {
  it('stores the invite token when an unconfirmed user opens the link', async () => {
    const ctx = makeStartCtx('/start invite-token');
    const { update, users, games } = makeUpdate();

    await update.onStart(ctx);

    expect(users.setPendingInvite).toHaveBeenCalledWith('1', 'invite-token');
    expect(ctx.reply).toHaveBeenCalledWith(TEXT.askContact, expect.anything());
    expect(games.join).not.toHaveBeenCalled();
  });

  it('joins immediately when the user is already confirmed', async () => {
    const ctx = makeStartCtx('/start invite-token');
    const { update, games } = makeUpdate({ isConfirmed: true });

    await update.onStart(ctx);

    expect(games.join).toHaveBeenCalledWith('invite-token', 'user-1');
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Question'),
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('uses the pending invite after phone confirmation', async () => {
    const ctx = makeContactCtx();
    const { update, users, games } = makeUpdate();
    users.takePendingInvite.mockResolvedValue('invite-token');

    await update.onContact(ctx);

    expect(users.confirm).toHaveBeenCalledWith('1', '+79990000000');
    expect(ctx.reply).toHaveBeenCalledWith(TEXT.confirmed, expect.anything());
    expect(games.join).toHaveBeenCalledWith('invite-token', 'user-1');
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Question'),
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('does not try to join when there is no pending invite', async () => {
    const ctx = makeContactCtx();
    const { update, users, games } = makeUpdate();

    await update.onContact(ctx);

    expect(users.confirm).toHaveBeenCalledOnce();
    expect(users.takePendingInvite).toHaveBeenCalledWith('1');
    expect(games.join).not.toHaveBeenCalled();
  });
});

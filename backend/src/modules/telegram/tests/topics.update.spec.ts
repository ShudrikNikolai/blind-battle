import type { Context } from 'telegraf';
import { describe, expect, it, vi } from 'vitest';
import type { GameService } from '@/modules/game/core/game.service';
import type { TelegramService } from '../core/telegram.service';
import { TopicsUpdate } from '../updates/topics.update';
import { TEXT } from '../utils/consts/texts';

const TAG_ID = '3f2b8c1e-5a4d-4e7b-9c1a-2d6e8f0a1b3c';

const makeCtx = (match?: string[]) =>
  ({
    botInfo: { username: 'test_bot' },
    match,
    reply: vi.fn().mockResolvedValue(undefined),
    answerCbQuery: vi.fn().mockResolvedValue(undefined),
  }) as unknown as Context & { match: RegExpExecArray };

const makeUpdate = (
  topics: { id: string; name: string }[],
  tgOverrides: Record<string, unknown> = {},
) => {
  const games = {
    listTopics: vi.fn().mockResolvedValue(topics),
    create: vi.fn().mockResolvedValue({ inviteToken: 'invite-token' }),
  };
  const tg = {
    isPrivate: vi.fn().mockReturnValue(true),
    requireUser: vi.fn().mockResolvedValue({ id: 'user-1' }),
    editCurrent: vi.fn().mockResolvedValue(undefined),
    ...tgOverrides,
  };
  const update = new TopicsUpdate(
    games as unknown as GameService,
    tg as unknown as TelegramService,
  );
  return { update, games, tg };
};

describe('TopicsUpdate', () => {
  it('shows published topics as an inline keyboard', async () => {
    const ctx = makeCtx();
    const { update, games } = makeUpdate([{ id: TAG_ID, name: 'Математика' }]);

    await update.onTopics(ctx);

    expect(games.listTopics).toHaveBeenCalledOnce();
    expect(ctx.reply).toHaveBeenCalledWith(
      TEXT.pickTopic,
      expect.objectContaining({
        parse_mode: 'HTML',
        reply_markup: expect.anything(),
      }),
    );
  });

  it('shows an empty state when there are no topics', async () => {
    const ctx = makeCtx();
    const { update } = makeUpdate([]);

    await update.onTopics(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(TEXT.noTopics);
  });

  it('creates a duel for the selected topic', async () => {
    const ctx = makeCtx([`t:${TAG_ID}`, TAG_ID]);
    const { update, games, tg } = makeUpdate([
      { id: TAG_ID, name: 'Математика' },
    ]);

    await update.onPick(ctx);

    expect(games.create).toHaveBeenCalledWith('user-1', TAG_ID);
    expect(ctx.answerCbQuery).toHaveBeenCalled();
    expect(tg.editCurrent).toHaveBeenCalledWith(
      ctx,
      expect.stringContaining('invite-token'),
      expect.anything(),
    );
  });

  it('rejects non-private callback chats', async () => {
    const ctx = makeCtx([`t:${TAG_ID}`, TAG_ID]);
    const { update, games } = makeUpdate([], {
      isPrivate: vi.fn().mockReturnValue(false),
    });

    await update.onPick(ctx);

    expect(games.create).not.toHaveBeenCalled();
    expect(ctx.answerCbQuery).toHaveBeenCalledWith(TEXT.privateOnly, {
      show_alert: true,
    });
  });
});

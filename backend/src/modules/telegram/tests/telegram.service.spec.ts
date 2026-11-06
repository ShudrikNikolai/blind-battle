import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Context, Telegraf } from 'telegraf';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TelegramMode } from '@/config';
import type { UserService } from '@/modules/user/core/user.service';
import { TelegramService } from '../core/telegram.service';

const makeConfig = (mode: TelegramMode, secret = '') =>
  ({
    getOrThrow: (key: string) =>
      key === 'TELEGRAM'
        ? { adminIds: [], token: 'token', mode, webhookSecret: secret }
        : { baseUrl: 'https://example.com', globalPrefix: 'api' },
  }) as unknown as ConfigService;

const makeBot = () => ({
  botInfo: undefined as unknown,
  telegram: {
    getMe: vi.fn().mockResolvedValue({ username: 'test_bot' }),
    setWebhook: vi.fn().mockResolvedValue(true),
    setMyCommands: vi.fn().mockResolvedValue(true),
  },
});

describe('TelegramService webhook bootstrap', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('registers the webhook and fills botInfo in webhook mode', async () => {
    const bot = makeBot();
    const service = new TelegramService(
      bot as unknown as Telegraf<Context>,
      {} as unknown as UserService,
      makeConfig('webhook', 'a'.repeat(32)),
    );

    await service.onApplicationBootstrap();

    expect(bot.telegram.getMe).toHaveBeenCalledOnce();
    expect(bot.telegram.setWebhook).toHaveBeenCalledWith(
      'https://example.com/api/telegram/webhook',
      {
        secret_token: 'a'.repeat(32),
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false,
      },
    );
    expect(bot.telegram.setMyCommands).toHaveBeenCalledOnce();
  });

  it('does not touch webhook in polling mode', async () => {
    const bot = makeBot();
    const service = new TelegramService(
      bot as unknown as Telegraf<Context>,
      {} as unknown as UserService,
      makeConfig('polling'),
    );

    await service.onApplicationBootstrap();

    expect(bot.telegram.getMe).not.toHaveBeenCalled();
    expect(bot.telegram.setWebhook).not.toHaveBeenCalled();
    expect(bot.telegram.setMyCommands).toHaveBeenCalledOnce();
  });

  it('fails startup when webhook registration fails', async () => {
    const bot = makeBot();
    bot.telegram.setWebhook.mockRejectedValueOnce(new Error('telegram down'));
    const service = new TelegramService(
      bot as unknown as Telegraf<Context>,
      {} as unknown as UserService,
      makeConfig('webhook', 'a'.repeat(32)),
    );

    await expect(service.onApplicationBootstrap()).rejects.toThrow(
      'telegram down',
    );
  });
});

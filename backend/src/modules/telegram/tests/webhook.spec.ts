import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Context, Telegraf } from 'telegraf';
import type { Update } from 'telegraf/types';
import { describe, expect, it, vi } from 'vitest';
import { TELEGRAM_SECRET_HEADER } from '../webhook/consts';
import { TelegramWebhookController } from '../webhook/telegram-webhook.controller';
import { TelegramWebhookGuard } from '../webhook/telegram-webhook.guard';

const makeGuard = (mode: 'polling' | 'webhook', secret: string) =>
  new TelegramWebhookGuard({
    getOrThrow: () => ({ mode, webhookSecret: secret }),
  } as unknown as ConfigService);

const makeContext = (secret?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        header: (name: string) =>
          name === TELEGRAM_SECRET_HEADER ? secret : undefined,
      }),
    }),
  }) as unknown as ExecutionContext;

describe('TelegramWebhookGuard', () => {
  const secret = 'a'.repeat(32);

  it('rejects every request in polling mode', () => {
    const guard = makeGuard('polling', '');
    expect(() => guard.canActivate(makeContext(secret))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects missing and wrong secret', () => {
    const guard = makeGuard('webhook', secret);

    expect(() => guard.canActivate(makeContext())).toThrow(ForbiddenException);
    expect(() => guard.canActivate(makeContext('b'.repeat(32)))).toThrow(
      ForbiddenException,
    );
  });

  it('accepts the expected secret', () => {
    const guard = makeGuard('webhook', secret);
    expect(guard.canActivate(makeContext(secret))).toBe(true);
  });
});

describe('TelegramWebhookController', () => {
  it('passes the update to Telegraf', async () => {
    const bot = { handleUpdate: vi.fn().mockResolvedValue(undefined) };
    const controller = new TelegramWebhookController(
      bot as unknown as Telegraf<Context>,
    );
    const update = { update_id: 1 } as unknown as Update;

    await expect(controller.handle(update)).resolves.toEqual({ ok: true });
    expect(bot.handleUpdate).toHaveBeenCalledWith(update);
  });
});

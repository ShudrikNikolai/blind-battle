import { ConfigModule } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { getBotToken } from 'nestjs-telegraf';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { configureApp } from '@/app.setup';
import { configInit } from '@/config';
import { TelegramWebhookController } from '@/modules/telegram/webhook/telegram-webhook.controller';
import { TelegramWebhookGuard } from '@/modules/telegram/webhook/telegram-webhook.guard';

const SECRET = 'e2e'.repeat(8);

const restoreEnv = (key: string, value: string | undefined): void => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
};

describe('Telegram webhook route', () => {
  const bot = { handleUpdate: vi.fn().mockResolvedValue(undefined) };
  const saved = {
    mode: process.env.TELEGRAM_MODE,
    baseUrl: process.env.APP_BASE_URL,
    secret: process.env.TELEGRAM_WEBHOOK_SECRET,
  };
  let app: NestExpressApplication;

  beforeAll(async () => {
    process.env.TELEGRAM_MODE = 'webhook';
    process.env.APP_BASE_URL = 'https://example.com';
    process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configInit] }),
      ],
      controllers: [TelegramWebhookController],
      providers: [
        TelegramWebhookGuard,
        { provide: getBotToken(), useValue: bot },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    await configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    restoreEnv('TELEGRAM_MODE', saved.mode);
    restoreEnv('APP_BASE_URL', saved.baseUrl);
    restoreEnv('TELEGRAM_WEBHOOK_SECRET', saved.secret);
  });

  it('rejects requests without the secret header', async () => {
    await request(app.getHttpServer())
      .post('/api/telegram/webhook')
      .send({ update_id: 1 })
      .expect(403);
  });

  it('rejects requests with a wrong secret', async () => {
    await request(app.getHttpServer())
      .post('/api/telegram/webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', 'wrong')
      .send({ update_id: 1 })
      .expect(403);
  });

  it('passes an authorized update to Telegraf', async () => {
    await request(app.getHttpServer())
      .post('/api/telegram/webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', SECRET)
      .send({ update_id: 42 })
      .expect(200)
      .expect({ ok: true });

    expect(bot.handleUpdate).toHaveBeenCalledWith({ update_id: 42 });
  });
});

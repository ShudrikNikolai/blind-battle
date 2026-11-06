import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import type { Context, Telegraf } from 'telegraf';
import type { Update } from 'telegraf/types';
import { TelegramWebhookGuard } from './telegram-webhook.guard';

@Controller({ path: 'telegram', version: VERSION_NEUTRAL })
export class TelegramWebhookController {
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  @Post('webhook')
  @HttpCode(200)
  @UseGuards(TelegramWebhookGuard)
  async handle(@Body() update: Update): Promise<{ ok: true }> {
    await this.bot.handleUpdate(update);
    return { ok: true };
  }
}

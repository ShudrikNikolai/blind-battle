import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { TelegramMode, TTelegram } from '@/config';
import { TELEGRAM_SECRET_HEADER } from './consts';

@Injectable()
export class TelegramWebhookGuard implements CanActivate {
  private readonly mode: TelegramMode;
  private readonly secret: string;

  constructor(config: ConfigService) {
    const telegram = config.getOrThrow<TTelegram>('TELEGRAM');
    this.mode = telegram.mode;
    this.secret = telegram.webhookSecret;
  }

  canActivate(context: ExecutionContext): boolean {
    // В polling-режиме роут существует, но updates нелюраюатывает
    if (this.mode !== 'webhook') {
      throw new ForbiddenException();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header(TELEGRAM_SECRET_HEADER) ?? '';

    if (!this.matches(provided)) {
      throw new ForbiddenException();
    }
    return true;
  }

  private matches(provided: string): boolean {
    const actual = Buffer.from(provided);
    const expected = Buffer.from(this.secret);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}

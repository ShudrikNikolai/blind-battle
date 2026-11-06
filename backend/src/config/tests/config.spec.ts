import { describe, expect, it } from 'vitest';
import {
  assertTelegramWebhookUrl,
  parseTelegramMode,
  parseTelegramWebhookSecret,
} from '../index';

describe('telegram config', () => {
  it('accepts polling and webhook modes only', () => {
    expect(parseTelegramMode('')).toBe('polling');
    expect(parseTelegramMode('polling')).toBe('polling');
    expect(parseTelegramMode('webhook')).toBe('webhook');
    expect(() => parseTelegramMode('longpoll')).toThrow(/TELEGRAM_MODE/);
  });

  it('requires a valid long enough secret only in webhook mode', () => {
    expect(parseTelegramWebhookSecret('polling', '')).toBe('');
    expect(parseTelegramWebhookSecret('webhook', 'a'.repeat(32))).toBe(
      'a'.repeat(32),
    );
    expect(() => parseTelegramWebhookSecret('webhook', 'short')).toThrow(
      /16\.\.256/,
    );
    expect(() =>
      parseTelegramWebhookSecret('webhook', 'bad secret with spaces'),
    ).toThrow(/A-Za-z0-9_-/);
  });

  it('requires https base URL only in webhook mode', () => {
    expect(() =>
      assertTelegramWebhookUrl('webhook', 'http://example.com'),
    ).toThrow(/https/);
    expect(() =>
      assertTelegramWebhookUrl('webhook', 'https://example.com'),
    ).not.toThrow();
    expect(() =>
      assertTelegramWebhookUrl('polling', 'http://localhost:3000'),
    ).not.toThrow();
  });
});

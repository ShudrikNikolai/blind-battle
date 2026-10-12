import { describe, expect, it } from 'vitest';
import type { GameFinishedEvent } from '@/common/events/game.event';
import {
  ANSWER_RE,
  answerData,
  escapeHtml,
  formatLeft,
  outcomeFor,
  renderQuestion,
  renderResult,
  renderSoloResult,
  SOLO_RE,
  soloData,
  startPayload,
} from '../utils/render';

const GAME_ID = '3f2b8c1e-5a4d-4e7b-9c1a-2d6e8f0a1b3c';

describe('callback data', () => {
  it('fits into 64 bytes and round-trips through the regex', () => {
    const data = answerData(GAME_ID, 12, 3);
    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(64);
    expect(ANSWER_RE.exec(data)!.slice(1)).toEqual([GAME_ID, '12', '3']);
  });

  it('rejects malformed data', () => {
    expect(ANSWER_RE.test('a:not-a-uuid:1:1')).toBe(false);
    expect(ANSWER_RE.test(`a:${GAME_ID}:x:1`)).toBe(false);
  });
});

describe('startPayload', () => {
  it('extracts a valid token', () => {
    expect(startPayload('/start Abc123_-xyz')).toBe('Abc123_-xyz');
  });
  it('returns null for no payload or junk', () => {
    expect(startPayload('/start')).toBeNull();
    expect(startPayload('/start <script>')).toBeNull();
    expect(startPayload(undefined)).toBeNull();
  });
});

describe('escapeHtml', () => {
  it('escapes tags and ampersands', () => {
    expect(escapeHtml('<b>a&b</b>')).toBe('&lt;b&gt;a&amp;b&lt;/b&gt;');
  });
});

describe('renderQuestion', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');
  const view = {
    gameId: GAME_ID,
    index: 1,
    total: 3,
    question: 'Что делает <b>VACUUM</b>?',
    buttons: ['a', 'b'],
    deadlineAt: new Date(now + 83_000),
  };

  it('shows progress, escaped text and time left', () => {
    const text = renderQuestion(view, now);
    expect(text).toContain('Вопрос 2/3');
    expect(text).toContain('&lt;b&gt;VACUUM&lt;/b&gt;');
    expect(text).toContain('Осталось: 1:23');
  });

  it('never leaks correctness flags', () => {
    expect(renderQuestion(view, now)).not.toContain('isCorrectAnswer');
  });

  it('clamps time left at zero', () => {
    expect(formatLeft(new Date(now - 5000), now)).toBe('0:00');
  });
});

describe('results', () => {
  const base: GameFinishedEvent = {
    gameId: GAME_ID,
    authorId: 'a',
    rivalId: 'r',
    winner: 'author',
    authorScore: 3,
    rivalScore: 1,
    total: 3,
    authorCorrect: [],
    rivalCorrect: [],
  };

  it('computes outcome per side', () => {
    expect(outcomeFor('author', 'author')).toBe('win');
    expect(outcomeFor('rival', 'author')).toBe('lose');
    expect(outcomeFor('rival', 'draw')).toBe('draw');
  });

  it('renders own score first and the verdict for each side', () => {
    const forAuthor = renderResult('author', base, 'Вася');
    expect(forAuthor).toContain('Ты: <b>3/3</b>');
    expect(forAuthor).toContain('Вася: <b>1/3</b>');
    expect(forAuthor).toContain('Победа');

    const forRival = renderResult('rival', base, 'Петя');
    expect(forRival).toContain('Ты: <b>1/3</b>');
    expect(forRival).toContain('Поражение');
  });

  it('escapes the rival name', () => {
    expect(renderResult('author', base, '<i>x</i>')).toContain(
      '&lt;i&gt;x&lt;/i&gt;',
    );
  });
});

describe('solo', () => {
  it('callback data fits Telegram limit and round-trips', () => {
    const data = soloData(GAME_ID);
    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(64);
    expect(SOLO_RE.exec(data)![1]).toBe(GAME_ID);
  });

  it('marks the question as a test', () => {
    const view = {
      gameId: GAME_ID,
      index: 0,
      total: 1,
      question: 'Q',
      buttons: ['a', 'b'],
      deadlineAt: new Date(Date.now() + 60_000),
    };
    expect(renderQuestion(view, Date.now(), true)).toContain('🧪 Тест');
    expect(renderQuestion(view)).not.toContain('🧪');
  });

  it('renders per-question marks and flags unanswered ones', () => {
    const text = renderSoloResult({
      gameId: GAME_ID,
      userId: 'u',
      score: 1,
      total: 3,
      answered: 2,
      correct: [true, false, false],
    });
    expect(text).toContain('<b>1/3</b>');
    expect(text).toContain('1. ✅');
    expect(text).toContain('2. ❌');
    expect(text).toContain('3. ➖');
    expect(text).toContain('Время вышло');
  });

  it('has no timeout note when everything was answered', () => {
    const text = renderSoloResult({
      gameId: GAME_ID,
      userId: 'u',
      score: 3,
      total: 3,
      answered: 3,
      correct: [true, true, true],
    });
    expect(text).not.toContain('Время вышло');
  });
});

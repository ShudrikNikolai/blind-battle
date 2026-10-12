import { describe, expect, it } from 'vitest';
import {
  buildQuestionView,
  correctness,
  decideWinner,
  isComplete,
  score,
} from '../domain/game.domain';
import { QuizSnapshot } from '@/modules/admin/ports/quiz.port';

const quiz: QuizSnapshot = {
  timeLimitSec: 60,
  questions: [
    {
      question: 'Q1',
      buttons: [
        { text: 'a', isCorrectAnswer: false },
        { text: 'b', isCorrectAnswer: true },
      ],
    },
    {
      question: 'Q2',
      buttons: [
        { text: 'c', isCorrectAnswer: true },
        { text: 'd', isCorrectAnswer: false },
      ],
    },
    {
      question: 'Q3',
      buttons: [
        { text: 'e', isCorrectAnswer: false },
        { text: 'f', isCorrectAnswer: true },
      ],
    },
  ],
};

describe('correctness / score', () => {
  it('marks answers by button index', () => {
    expect(correctness(quiz, [1, 1, 1])).toEqual([true, false, true]);
  });

  it('treats unanswered questions as wrong', () => {
    const flags = correctness(quiz, [1]);
    expect(flags).toEqual([true, false, false]);
    expect(score(flags)).toBe(1);
  });

  it('treats an out-of-range index as wrong', () => {
    expect(correctness(quiz, [9, 9, 9])).toEqual([false, false, false]);
  });
});

describe('decideWinner', () => {
  it('picks author, rival or draw', () => {
    expect(decideWinner(3, 1)).toBe('author');
    expect(decideWinner(0, 2)).toBe('rival');
    expect(decideWinner(2, 2)).toBe('draw');
  });
});

describe('isComplete', () => {
  it('is true only when every question has an answer', () => {
    expect(isComplete(quiz, [0, 0])).toBe(false);
    expect(isComplete(quiz, [0, 0, 0])).toBe(true);
  });
});

describe('buildQuestionView', () => {
  const game = { id: 'g1', quiz, deadlineAt: new Date('2026-01-01T00:00:00Z') };

  it('returns the question without correctness flags', () => {
    const view = buildQuestionView(game, 1)!;
    expect(view).toMatchObject({
      gameId: 'g1',
      index: 1,
      total: 3,
      question: 'Q2',
      buttons: ['c', 'd'],
    });
    expect(JSON.stringify(view)).not.toContain('isCorrectAnswer');
  });

  it('returns null when the player is past the last question', () => {
    expect(buildQuestionView(game, 3)).toBeNull();
  });

  it('returns null when the game has no deadline yet', () => {
    expect(buildQuestionView({ ...game, deadlineAt: null }, 0)).toBeNull();
  });
});

import { QuizSnapshot } from '@/modules/admin/ports/quiz.port';
import { everyoneDone } from '@/modules/game/domain/game.domain';

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

describe('everyoneDone', () => {
  const base = { quiz, authorAnswers: [0, 0, 0], rivalAnswers: [0] };

  it('versus waits for both players', () => {
    expect(everyoneDone({ ...base, mode: 'versus' })).toBe(false);
    expect(
      everyoneDone({ ...base, mode: 'versus', rivalAnswers: [0, 0, 0] }),
    ).toBe(true);
  });

  it('solo needs only the author', () => {
    expect(everyoneDone({ ...base, mode: 'solo' })).toBe(true);
    expect(everyoneDone({ ...base, mode: 'solo', authorAnswers: [0] })).toBe(
      false,
    );
  });
});

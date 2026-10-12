import type { GameWinner } from '../core/game.entity';
import type { QuestionView } from '../dtos/game.dto';
import type { GameMode } from '../core/game.entity';

import { QuizSnapshot } from '../../admin/ports/quiz.port';

/** Верно/неверно по каждому вопросу. Без ответа = неверно. */
export const correctness = (quiz: QuizSnapshot, answers: number[]): boolean[] =>
  quiz.questions.map((q, i) => q.buttons[answers[i]]?.isCorrectAnswer === true);

export const score = (flags: boolean[]): number => flags.filter(Boolean).length;

export const decideWinner = (author: number, rival: number): GameWinner =>
  author === rival ? 'draw' : author > rival ? 'author' : 'rival';

export const isComplete = (quiz: QuizSnapshot, answers: number[]): boolean =>
  answers.length >= quiz.questions.length;

export const buildQuestionView = (
  game: { id: string; quiz: QuizSnapshot; deadlineAt: Date | null },
  index: number,
): QuestionView | null => {
  const q = game.quiz.questions[index];
  if (!q || !game.deadlineAt) return null;
  return {
    gameId: game.id,
    index,
    total: game.quiz.questions.length,
    question: q.question,
    buttons: q.buttons.map((b) => b.text),
    deadlineAt: game.deadlineAt,
  };
};

export const everyoneDone = (g: {
  mode: GameMode;
  quiz: QuizSnapshot;
  authorAnswers: number[];
  rivalAnswers: number[];
}): boolean =>
  isComplete(g.quiz, g.authorAnswers) &&
  (g.mode === 'solo' || isComplete(g.quiz, g.rivalAnswers));

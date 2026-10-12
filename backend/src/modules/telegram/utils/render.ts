import type { QuestionView } from '@/modules/game/dtos/game.dto';
import type {
  GameFinishedEvent,
  GameSoloFinishedEvent,
} from '@/common/events/game.event';

export type Side = 'author' | 'rival';
export type Outcome = 'win' | 'lose' | 'draw';

export const SOLO_RE = /^s:([0-9a-f-]{36})$/;
export const soloData = (quizId: string): string => `s:${quizId}`;

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// callback_data: a:<gameId>:<questionIndex>:<buttonIndex>
export const ANSWER_RE = /^a:([0-9a-f-]{36}):(\d{1,2}):(\d{1,2})$/;
export const answerData = (gameId: string, q: number, b: number): string =>
  `a:${gameId}:${q}:${b}`;

// '/start Abc123_-xyz' → 'Abc123_-xyz'; мусор → null
export const startPayload = (text?: string): string | null => {
  const raw = text?.trim().split(/\s+/)[1];
  return raw && /^[A-Za-z0-9_-]{8,64}$/.test(raw) ? raw : null;
};

export const formatLeft = (deadlineAt: Date, now = Date.now()): string => {
  const sec = Math.max(0, Math.ceil((deadlineAt.getTime() - now) / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

export const renderQuestion = (
  q: QuestionView,
  now = Date.now(),
  solo = false,
): string =>
  `${solo ? '🧪 Тест · ' : ''}❓ <b>Вопрос ${q.index + 1}/${q.total}</b>\n\n` +
  `${escapeHtml(q.question)}\n\n⏳ Осталось: ${formatLeft(q.deadlineAt, now)}`;

export const outcomeFor = (
  side: Side,
  winner: GameFinishedEvent['winner'],
): Outcome => (winner === 'draw' ? 'draw' : winner === side ? 'win' : 'lose');

export const renderResult = (
  side: Side,
  e: GameFinishedEvent,
  rivalName: string,
): string => {
  const mine = side === 'author' ? e.authorScore : e.rivalScore;
  const theirs = side === 'author' ? e.rivalScore : e.authorScore;
  const verdict = { win: '🏆 Победа!', lose: '😔 Поражение', draw: '🤝 Ничья' }[
    outcomeFor(side, e.winner)
  ];
  return (
    `🏁 <b>Игра окончена</b>\n\nТы: <b>${mine}/${e.total}</b>\n` +
    `${escapeHtml(rivalName)}: <b>${theirs}/${e.total}</b>\n\n${verdict}`
  );
};

export const renderSoloResult = (e: GameSoloFinishedEvent): string => {
  const lines = e.correct
    .map((ok, i) => `${i + 1}. ${i >= e.answered ? '➖' : ok ? '✅' : '❌'}`)
    .join('\n');
  const note =
    e.answered < e.total ? '\n\n⌛ Время вышло: ➖ вопросы без ответа.' : '';
  return `🧪 <b>Тестовая игра окончена</b>\n\nРезультат: <b>${e.score}/${e.total}</b>\n\n${lines}${note}`;
};

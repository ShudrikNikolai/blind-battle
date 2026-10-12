import { Markup } from 'telegraf';
import type { QuestionView } from '@/modules/game/dtos/game.dto';
import { TEXT } from '../consts/texts';
import { answerData, soloData } from '../render';
import { QuizSummary } from '@/modules/admin/ports/quiz.port';

export const contactKeyboard = () =>
  Markup.keyboard([[Markup.button.contactRequest('📱 Поделиться номером')]])
    .oneTime()
    .resize();

export const answerKeyboard = (q: QuestionView) =>
  Markup.inlineKeyboard(
    q.buttons.map((text, i) => [
      Markup.button.callback(text, answerData(q.gameId, q.index, i)),
    ]),
  );

export const shareKeyboard = (link: string) =>
  Markup.inlineKeyboard([
    [
      Markup.button.url(
        '📤 Отправить сопернику',
        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(TEXT.shareText)}`,
      ),
    ],
  ]);

export const soloKeyboard = (quizzes: QuizSummary[]) =>
  Markup.inlineKeyboard(
    quizzes.map((q) => [
      Markup.button.callback(
        `${q.isPublished ? '🟢' : '⚪'} ${q.title}`.slice(0, 60),
        soloData(q.id),
      ),
    ]),
  );

import { UseFilters } from '@nestjs/common';
import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { GameService } from '@/modules/game/core/game.service';
import { TelegramService } from '../core/telegram.service';
import { TEXT } from '../utils/consts/texts';
import { answerKeyboard, soloKeyboard } from '../utils/keyboards/keyboards';
import { renderQuestion, SOLO_RE } from '../utils/render';
import { TelegramExceptionFilter } from '../filters/telegraf-exception.filter';

@Update()
@UseFilters(TelegramExceptionFilter)
export class AdminUpdate {
  constructor(
    private readonly games: GameService,
    private readonly tg: TelegramService,
  ) {}

  @Command('test')
  async onTest(@Ctx() ctx: Context): Promise<void> {
    // не админам не отвечаем,команды как бы не существует
    if (!this.tg.isPrivate(ctx) || !this.tg.isAdmin(ctx)) return;

    const quizzes = await this.games.listTestQuizzes(10);
    if (!quizzes.length) {
      await ctx.reply(TEXT.noQuizzes);
      return;
    }

    await ctx.reply(TEXT.pickQuiz, {
      parse_mode: 'HTML',
      ...soloKeyboard(quizzes),
    });
  }

  @Action(SOLO_RE)
  async onPick(
    @Ctx() ctx: Context & { match: RegExpExecArray },
  ): Promise<void> {
    if (!this.tg.isAdmin(ctx)) {
      await ctx.answerCbQuery();
      return;
    }

    const user = await this.tg.requireUser(ctx);
    if (!user) {
      await ctx.answerCbQuery();
      return;
    }

    const game = await this.games.createSolo(user.id, ctx.match[1]);

    const question = await this.games.getQuestion(game.id, user.id);
    await ctx.answerCbQuery();
    if (question) {
      await ctx.reply(renderQuestion(question, Date.now(), true), {
        parse_mode: 'HTML',
        ...answerKeyboard(question),
      });
    }
  }
}

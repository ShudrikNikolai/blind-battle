import { UseFilters } from '@nestjs/common';
import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { GameService } from '@/modules/game/core/game.service';
import { TelegramService } from '../core/telegram.service';
import { TelegramExceptionFilter } from '../filters/telegraf-exception.filter';
import { TEXT } from '../utils/consts/texts';
import { shareKeyboard, topicsKeyboard } from '../utils/keyboards/keyboards';
import { TOPIC_RE } from '../utils/render';

@Update()
@UseFilters(TelegramExceptionFilter)
export class TopicsUpdate {
  constructor(
    private readonly games: GameService,
    private readonly tg: TelegramService,
  ) {}

  @Command('topics')
  async onTopics(@Ctx() ctx: Context): Promise<void> {
    if (!this.tg.isPrivate(ctx)) {
      return void (await ctx.reply(TEXT.privateOnly));
    }

    const user = await this.tg.requireUser(ctx, { confirmed: true });
    if (!user) return;

    const topics = await this.games.listTopics();
    if (!topics.length) {
      await ctx.reply(TEXT.noTopics);
      return;
    }

    await ctx.reply(TEXT.pickTopic, {
      parse_mode: 'HTML',
      ...topicsKeyboard(topics),
    });
  }

  @Action(TOPIC_RE)
  async onPick(
    @Ctx() ctx: Context & { match: RegExpExecArray },
  ): Promise<void> {
    if (!this.tg.isPrivate(ctx)) {
      await ctx.answerCbQuery(TEXT.privateOnly, { show_alert: true });
      return;
    }

    const user = await this.tg.requireUser(ctx, { confirmed: true });
    if (!user) {
      await ctx.answerCbQuery();
      return;
    }

    const game = await this.games.create(user.id, ctx.match[1]);
    const link = `https://t.me/${ctx.botInfo.username}?start=${game.inviteToken}`;

    await ctx.answerCbQuery();
    await this.tg.editCurrent(ctx, TEXT.duelCreated(link), {
      ...shareKeyboard(link),
      link_preview_options: { is_disabled: true },
    });
  }
}

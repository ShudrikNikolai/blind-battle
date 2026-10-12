import { UseFilters } from '@nestjs/common';
import { Command, Ctx, On, Start, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import type { Message } from 'telegraf/types';
import { UserService } from '@/modules/user/user.service';
import { GameService } from '@/modules/game/core/game.service';
import { TelegramService } from '../core/telegram.service';
import { TEXT } from '../utils/consts/texts';
import {
  answerKeyboard,
  contactKeyboard,
  shareKeyboard,
} from '../utils/keyboards/keyboards';
import { renderQuestion, startPayload } from '../utils/render';
import { Markup } from 'telegraf';
import { TelegramExceptionFilter } from '../filters/telegraf-exception.filter';

@Update()
@UseFilters(TelegramExceptionFilter)
export class StartUpdate {
  constructor(
    private readonly users: UserService,
    private readonly games: GameService,
    private readonly tg: TelegramService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    if (!this.tg.isPrivate(ctx))
      return void (await ctx.reply(TEXT.privateOnly));

    const from = ctx.from!;
    const user = await this.users.register({
      telegramId: String(from.id),
      firstName: from.first_name,
      userName: from.username ?? null,
    });

    if (!user.isConfirmed) {
      await ctx.reply(TEXT.askContact, { ...contactKeyboard() });
      return;
    }

    const text =
      ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
    const token = startPayload(text);
    if (!token) {
      await ctx.reply(TEXT.welcome, { parse_mode: 'HTML' });
      return;
    }

    // соперник по ссылке: join запускает таймер, автору первый вопрос уйдёт из слушателя события
    const game = await this.games.join(token, user.id);
    const question = await this.games.getQuestion(game.id, user.id);
    if (!question) {
      await ctx.reply(TEXT.allAnswered);
      return;
    }
    await ctx.reply(renderQuestion(question), {
      parse_mode: 'HTML',
      ...answerKeyboard(question),
    });
  }

  @Command('duel')
  async onDuel(@Ctx() ctx: Context): Promise<void> {
    if (!this.tg.isPrivate(ctx))
      return void (await ctx.reply(TEXT.privateOnly));

    const user = await this.tg.requireUser(ctx, { confirmed: true });
    if (!user) return;

    const game = await this.games.create(user.id);
    const link = `https://t.me/${ctx.botInfo.username}?start=${game.inviteToken}`;
    await ctx.reply(TEXT.duelCreated(link), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      ...shareKeyboard(link),
    });
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context): Promise<void> {
    if (!this.tg.isPrivate(ctx)) return;

    const contact = (ctx.message as Message.ContactMessage).contact;
    if (contact.user_id !== ctx.from!.id) {
      await ctx.reply(TEXT.contactNotYours);
      return;
    }

    const user = await this.users.findByTelegramId(String(ctx.from!.id));
    if (!user) return void (await ctx.reply(TEXT.needStart));
    if (user.isConfirmed) {
      await ctx.reply(TEXT.alreadyConfirmed, Markup.removeKeyboard());
      return;
    }

    await this.users.confirm(String(ctx.from!.id), contact.phone_number);
    await ctx.reply(TEXT.confirmed, Markup.removeKeyboard());
  }
}

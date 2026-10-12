import { UseFilters } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { UserService } from '@/modules/user/user.service';
import { GameService } from '@/modules/game/core/game.service';
import { TelegramService } from '../core/telegram.service';
import { answerKeyboard } from '../utils/keyboards/keyboards';
import { ANSWER_RE, renderQuestion } from '../utils/render';
import { TelegramExceptionFilter } from '../filters/telegraf-exception.filter';
import { TEXT } from '../utils/consts/texts';

@Update()
@UseFilters(TelegramExceptionFilter)
export class GameUpdate {
  constructor(
    private readonly users: UserService,
    private readonly games: GameService,
    private readonly tg: TelegramService,
  ) {}

  @Action(ANSWER_RE)
  async onAnswer(
    @Ctx() ctx: Context & { match: RegExpExecArray },
  ): Promise<void> {
    const [, gameId, q, b] = ctx.match;

    const user = await this.users.findByTelegramId(String(ctx.from!.id));
    if (!user) {
      await ctx.answerCbQuery(TEXT.needStart);
      return;
    }

    const res = await this.games.submitAnswer(
      gameId,
      user.id,
      Number(q),
      Number(b),
    );
    await ctx.answerCbQuery();

    if (res.next) {
      // для повторного тапа next это текущий вопрос, текст не изменится, ошибка игнорируется
      await this.tg.editCurrent(
        ctx,
        renderQuestion(res.next),
        answerKeyboard(res.next),
      );
      return;
    }
    await this.tg.editCurrent(
      ctx,
      res.finished ? TEXT.answersAccepted : TEXT.waitingRival,
    );
  }
}

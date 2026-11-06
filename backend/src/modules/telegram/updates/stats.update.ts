import { UseFilters } from '@nestjs/common';
import { Command, Ctx, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { StatisticUserService } from '@/modules/statistic/user/statistic-user.service';
import { TelegramService } from '../core/telegram.service';
import { TelegramExceptionFilter } from '../filters/telegraf-exception.filter';
import { TEXT } from '../utils/consts/texts';
import { renderStats } from '../utils/render';

@Update()
@UseFilters(TelegramExceptionFilter)
export class StatsUpdate {
  constructor(
    private readonly stats: StatisticUserService,
    private readonly tg: TelegramService,
  ) {}

  @Command('stats')
  async onStats(@Ctx() ctx: Context): Promise<void> {
    if (!this.tg.isPrivate(ctx)) {
      return void (await ctx.reply(TEXT.privateOnly));
    }

    const user = await this.tg.requireUser(ctx);
    if (!user) return;

    const stats = await this.stats.getStats(user.id);
    await ctx.reply(renderStats({ firstName: user.firstName, ...stats }), {
      parse_mode: 'HTML',
    });
  }
}

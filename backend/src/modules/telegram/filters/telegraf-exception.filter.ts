import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { ERROR_TEXTS } from '../utils/consts/texts';

const BY_STATUS: Record<number, string> = {
  400: 'Некорректный запрос.',
  403: 'Нет доступа.',
  404: 'Не найдено.',
  409: 'Сейчас это действие недоступно.',
};

@Catch()
export class TelegramExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegramExceptionFilter.name);

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = TelegrafArgumentsHost.create(host).getContext<Context>();

    let text = 'Что-то пошло не так. Попробуй ещё раз.';
    if (exception instanceof HttpException) {
      text =
        ERROR_TEXTS[exception.message] ??
        BY_STATUS[exception.getStatus()] ??
        text;
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    try {
      if (ctx.callbackQuery)
        await ctx.answerCbQuery(text, { show_alert: true });
      else await ctx.reply(text);
    } catch (e) {
      this.logger.warn(`reply failed ::: ${e}`);
    }
  }
}

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import type { Context, Telegraf } from 'telegraf';
import type { TelegramMode, TApp, TTelegram } from '@/config';
import { UserService } from '@/modules/user/core/user.service';
import type { UserDto } from '@/modules/user/dtos/user.dto';
import { BASE_COMMANDS } from '../utils/commands';
import { TEXT } from '../utils/consts/texts';
import { contactKeyboard } from '../utils/keyboards/keyboards';
import { TELEGRAM_WEBHOOK_PATH } from '../webhook/consts';

type ReplyExtra = Parameters<Context['reply']>[1];
type EditExtra = Parameters<Context['editMessageText']>[1];

@Injectable()
export class TelegramService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramService.name);
  private readonly adminIds: Array<string>;
  private readonly mode: TelegramMode;
  private readonly webhookSecret: string;
  private readonly webhookUrl: string;

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly users: UserService,
    config: ConfigService,
  ) {
    const telegram = config.getOrThrow<TTelegram>('TELEGRAM');
    const app = config.getOrThrow<TApp>('APP');

    this.adminIds = telegram.adminIds;
    this.mode = telegram.mode;
    this.webhookSecret = telegram.webhookSecret;

    const baseUrl = app.baseUrl.replace(/\/+$/, '');
    const prefix = app.globalPrefix.replace(/^\/+|\/+$/g, '');
    this.webhookUrl = `${baseUrl}/${prefix}/${TELEGRAM_WEBHOOK_PATH}`;
  }

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log(`telegram mode: ${this.mode}`);

    if (this.mode === 'webhook') {
      await this.setupWebhook();
    }

    await this.setupCommands();
  }

  private async setupWebhook(): Promise<void> {
    try {
      // При launchOptions: false Telegraf не вызывает getMe и не заполняет botInfo.
      // Без botInfo сломается ctx.botInfo.username в /duel.
      if (!this.bot.botInfo) {
        this.bot.botInfo = await this.bot.telegram.getMe();
      }

      await this.bot.telegram.setWebhook(this.webhookUrl, {
        secret_token: this.webhookSecret,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false,
      });

      this.logger.log(`telegram webhook set: ${this.webhookUrl}`);
    } catch (e) {
      this.logger.error(`telegram webhook setup failed ::: ${e}`);
      throw e;
    }
  }

  private async setupCommands(): Promise<void> {
    try {
      await this.bot.telegram.setMyCommands(BASE_COMMANDS);
    } catch (e) {
      this.logger.warn(`setMyCommands failed ::: ${e}`);
    }

    // /test видят только админы: команды с областью конкретного чата
    for (const id of this.adminIds) {
      try {
        await this.bot.telegram.setMyCommands(
          [
            ...BASE_COMMANDS,
            { command: 'test', description: 'Тестовая игра (админ)' },
          ],
          { scope: { type: 'chat', chat_id: Number(id) } },
        );
      } catch (e) {
        this.logger.warn(`admin commands failed ::: ${id} ::: ${e}`); // админ ещё не писал боту
      }
    }
  }

  /** Отправка вне контекста апдейта. Бот заблокирован или чат недоступен, значит false, без падения. */
  async send(
    chatId: string | number,
    text: string,
    extra?: ReplyExtra,
  ): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        ...extra,
      });
      return true;
    } catch (e) {
      this.logger.warn(`send failed ::: ${chatId} ::: ${e}`);
      return false;
    }
  }

  /** Редактирует сообщение, из которого пришёл callback. «Не изменилось» не считается ошибкой. */
  async editCurrent(
    ctx: Context,
    text: string,
    extra?: EditExtra,
  ): Promise<void> {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', ...extra });
    } catch (e) {
      if (e instanceof Error && e.message.includes('message is not modified'))
        return;
      throw e;
    }
  }

  isAdmin(ctx: Context): boolean {
    return !!ctx.from && this.adminIds.includes(String(ctx.from.id));
  }

  isPrivate(ctx: Context): boolean {
    return ctx.chat?.type === 'private';
  }

  /** Пользователь из БД; если не найден или не подтверждён, отвечает сам и возвращает null. */
  async requireUser(
    ctx: Context,
    opts: { confirmed?: boolean } = {},
  ): Promise<UserDto | null> {
    const user = await this.users.findByTelegramId(String(ctx.from!.id));
    if (!user) {
      await ctx.reply(TEXT.needStart);
      return null;
    }
    if (opts.confirmed && !user.isConfirmed) {
      await ctx.reply(TEXT.askContact, { ...contactKeyboard() });
      return null;
    }
    return user;
  }
}

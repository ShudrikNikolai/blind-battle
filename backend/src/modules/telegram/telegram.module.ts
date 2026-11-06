import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { GameModule } from '../game/game.module';
import { TelegramService } from './core/telegram.service';
import { StartUpdate } from './updates/start.update';
import { GameUpdate } from './updates/game.update';
import { GameListener } from './listeners/game.listener';
import { ConfigModule } from '@nestjs/config';
import { StatisticModule } from '../statistic/statistic.module';
import { AdminUpdate } from './updates/admin.update';
import { StatsUpdate } from './updates/stats.update';
import { TopicsUpdate } from './updates/topics.update';
import { TelegramWebhookController } from './webhook/telegram-webhook.controller';
import { TelegramWebhookGuard } from './webhook/telegram-webhook.guard';

@Module({
  imports: [ConfigModule, UserModule, GameModule, StatisticModule],
  controllers: [TelegramWebhookController],
  providers: [
    TelegramService,
    TelegramWebhookGuard,
    StartUpdate,
    GameUpdate,
    AdminUpdate,
    StatsUpdate,
    TopicsUpdate,
    GameListener,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}

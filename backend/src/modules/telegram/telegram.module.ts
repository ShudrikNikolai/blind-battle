import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { GameModule } from '../game/game.module';
import { TelegramService } from './core/telegram.service';
import { StartUpdate } from './updates/start.update';
import { GameUpdate } from './updates/game.update';
import { GameListener } from './listeners/game.listener';
import { ConfigModule } from '@nestjs/config';
import { AdminUpdate } from './updates/admin.update';

@Module({
  imports: [ConfigModule, UserModule, GameModule],
  providers: [
    TelegramService,
    StartUpdate,
    GameUpdate,
    AdminUpdate,
    GameListener,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}

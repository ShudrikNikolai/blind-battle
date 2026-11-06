import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { GameModule } from './game/game.module';
import { TelegramModule } from './telegram/telegram.module';
import { StatisticModule } from './statistic/statistic.module';

const modules = [
  HealthModule,
  AdminModule,
  GameModule,
  StatisticModule,
  TelegramModule,
];

@Module({
  imports: modules,
  exports: modules,
})
export class CoreModule {}

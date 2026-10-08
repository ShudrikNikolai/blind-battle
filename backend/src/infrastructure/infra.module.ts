import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';
import { ChModule } from './cache/cache.module';
import { EventModule } from './event/event.module';
import { BullMQModule } from './bullmq/bullmq.module';
import { TelegramModule } from './telegram/telegram.module';

const infra = [
  DatabaseModule,
  ChModule,
  EventModule,
  BullMQModule,
  TelegramModule,
];

@Module({
  imports: infra,
  exports: infra,
})
export class InfrastructureModule {}

import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';
import { ChModule } from './cache/cache.module';
import { EventModule } from './event/event.module';
import { BullMQModule } from './bullmq/bullmq.module';
import { CustomTelegrafModule } from './telegraf/telegraf.module';
import { SchedulerModule } from './scheduler/scheduler.module';

const infra = [
  DatabaseModule,
  ChModule,
  EventModule,
  BullMQModule,
  CustomTelegrafModule,
  SchedulerModule,
];

@Module({
  imports: infra,
  exports: infra,
})
export class InfrastructureModule {}

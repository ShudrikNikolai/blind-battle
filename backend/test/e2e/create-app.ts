import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { configureApp } from '@/app.setup';
import { TimeoutInterceptor, TransformInterceptor } from '@/common';
import { configInit } from '@/config';
import { BullMQModule } from '@/infrastructure/bullmq/bullmq.module';
import { EventModule } from '@/infrastructure/event/event.module';
import { SchedulerModule } from '@/infrastructure/scheduler/scheduler.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { GameModule } from '@/modules/game/game.module';
import { HealthModule } from '@/modules/health/health.module';
import { StatisticModule } from '@/modules/statistic/statistic.module';
import { UserModule } from '@/modules/user/user.module';
import { TestDatabaseModule } from './test-database.module';

/**
 * Собираем приложение без Telegram: бот на long polling не нужен и требует токен.
 * Остальные модули — как в AppModule, чтобы e2e проверял реальную проводку.
 */
export async function createE2eApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, load: [configInit] }),
      TestDatabaseModule,
      EventModule,
      BullMQModule,
      SchedulerModule,
      AdminModule,
      GameModule,
      StatisticModule,
      UserModule,
      HealthModule,
    ],
    providers: [
      { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
      { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  await configureApp(app);
  await app.init();
  return app;
}

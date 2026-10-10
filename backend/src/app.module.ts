import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configInit } from './config/index';
import { InfrastructureModule } from './infrastructure/infra.module';
import { CoreModule } from './modules/core.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TimeoutInterceptor, TransformInterceptor } from './common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configInit],
    }),
    InfrastructureModule,
    CoreModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}

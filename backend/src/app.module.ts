import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configInit } from './config/index';
import { InfrastructureModule } from './infrastructure/infra.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configInit],
    }),
    InfrastructureModule,
  ],
})
export class AppModule {}

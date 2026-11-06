import { TTelegram } from '@/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const tgConfig = configService.getOrThrow<TTelegram>('TELEGRAM');
        return {
          token: tgConfig.token,
          // В webhook-режиме не запускаем long polling; updates приходят в контроллер.
          launchOptions: tgConfig.mode === 'webhook' ? false : undefined,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class CustomTelegrafModule {}

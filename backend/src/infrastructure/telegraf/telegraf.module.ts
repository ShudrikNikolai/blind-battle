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
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class CustomTelegrafModule {}

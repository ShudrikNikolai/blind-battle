import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          // TODO
          token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
          launchOptions: {
            webhook: {
              domain: 'domain.tld',
              path: '/secret-path',
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class TelegramModule {}

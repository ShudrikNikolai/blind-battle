import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { TBullMQ } from '@/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const bullMQConf = configService.getOrThrow<TBullMQ>('BULLMQ');
        return {
          connection: {
            ...bullMQConf,
          },
        };
      },
    }),
  ],
})
export class BullMQModule {}

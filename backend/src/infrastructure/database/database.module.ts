import { TDatabase } from '@/config';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseConf = config.getOrThrow<TDatabase>('DATABASE');
        return {
          ...databaseConf,
          synchronize: false,
          autoLoadEntities: true,
          migrations: ['dist/infrastructure/database/migrations/*.{js,ts}'],
        };
      },
    }),
  ],
})
export class DatabaseModule {}

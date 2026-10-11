import { TDatabase } from '@/config';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { join } from 'node:path';

@Global()
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
          entities: [join(__dirname, '../../**/*.entity.{ts,js}')],
          migrations: ['dist/infrastructure/database/migrations/*.{js,ts}'],
        };
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

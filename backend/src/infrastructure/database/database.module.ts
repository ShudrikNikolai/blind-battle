import { IDatabase } from '@/config';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cfg = config.getOrThrow<IDatabase>('DATABASE');
        return {
          type: cfg.type,
          host: cfg.host,
          port: cfg.port,
          username: cfg.username,
          password: cfg.password,
          database: cfg.database,
          ssl: cfg.ssl,
          synchronize: false,
          logging: cfg.logging,
          autoLoadEntities: true,
          migrations: ['dist/infrastructure/database/migrations/*.{js,ts}'],
        };
      },
    }),
  ],
})
export class DatabaseModule {}

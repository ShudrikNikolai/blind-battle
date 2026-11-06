import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from '@/modules/admin/core/admin.entity';
import { QuizEntity } from '@/modules/admin/quiz/quiz.entity';
import { TagEntity } from '@/modules/admin/tag/tag.entity';
import { GameEntity } from '@/modules/game/core/game.entity';
import { NotificationEntity } from '@/modules/notification/notification.entity';
import { StatisticGameEntity } from '@/modules/statistic/game/statistic-game.entity';
import { StatisticUserEntity } from '@/modules/statistic/user/statistic-user.entity';
import { UserEntity } from '@/modules/user/core/user.entity';
import { TEST_DB } from './env';

/**
 * Для e2e нельзя использовать DatabaseModule: он грузит сущности по glob-маске,
 * а TypeORM в рантайме пытается require() TypeScript. Здесь перечисляем классы явно.
 */
const entities = [
  AdminEntity,
  QuizEntity,
  TagEntity,
  UserEntity,
  GameEntity,
  NotificationEntity,
  StatisticGameEntity,
  StatisticUserEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: TEST_DB.host,
      port: TEST_DB.port,
      username: TEST_DB.user,
      password: TEST_DB.password,
      database: TEST_DB.database,
      entities,
      synchronize: false,
      ssl: false,
      logging: false,
    }),
  ],
})
export class TestDatabaseModule {}

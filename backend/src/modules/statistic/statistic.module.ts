import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticGameEntity } from './game/statistic-game.entity';
import { StatisticGameRepository } from './game/statistic-game.repository';
import { StatisticGameService } from './game/statistic-game.service';
import { StatisticListener } from './listeners/statistic.listener';
import { StatisticUserEntity } from './user/statistic-user.entity';
import { StatisticUserRepository } from './user/statistic-user.repository';
import { StatisticUserService } from './user/statistic-user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StatisticGameEntity, StatisticUserEntity]),
  ],
  providers: [
    StatisticGameRepository,
    StatisticGameService,
    StatisticUserRepository,
    StatisticUserService,
    StatisticListener,
  ],
  exports: [StatisticGameService, StatisticUserService],
})
export class StatisticModule {}

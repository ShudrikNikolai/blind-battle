import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { GameEntity } from './core/game.entity';
import { GameRepository } from './core/game.repository';
import { GameService } from './core/game.service';
import { GameProcessor } from './tasks/game.processor';
import { GameScheduler } from './tasks/game.scheduler';
import { GAME_QUEUE } from './consts';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEntity]),
    BullModule.registerQueue({ name: GAME_QUEUE }),
  ],
  providers: [GameRepository, GameService, GameProcessor, GameScheduler],
  exports: [GameService],
})
export class GameModule {}

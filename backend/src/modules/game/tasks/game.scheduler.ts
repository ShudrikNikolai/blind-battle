import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GameRepository } from '../core/game.repository';
import { GameService } from '../core/game.service';

@Injectable()
export class GameScheduler {
  private readonly logger = new Logger(GameScheduler.name);

  constructor(
    private readonly repository: GameRepository,
    private readonly game: GameService,
  ) {}

  /** Страховка: игры с прошедшим дедлайном, которые не закрыл таймер (упал Redis, рестарт). */
  @Cron(CronExpression.EVERY_MINUTE)
  async sweepExpired(): Promise<void> {
    const ids = await this.repository.findExpiredActiveIds(100);
    for (const id of ids) {
      try {
        await this.game.finish(id);
      } catch (e) {
        this.logger.error(`sweep failed ::: ${id} ::: ${e}`);
      }
    }
  }
}

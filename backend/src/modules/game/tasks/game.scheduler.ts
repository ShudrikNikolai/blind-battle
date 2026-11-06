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

  //истёкшие игры и игры, где все уже ответили, но finish не сработал
  @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
  async sweepFinishable(): Promise<void> {
    const ids = await this.repository.findFinishableActiveIds(100);
    for (const id of ids) {
      try {
        await this.game.finish(id);
      } catch (e) {
        this.logger.error(`sweep failed ::: ${id} ::: ${e}`);
      }
    }
  }

  // очистка дуэлей к которым так и не присоединились
  @Cron(CronExpression.EVERY_DAY_AT_4AM, { waitForCompletion: true })
  async cleanupAbandoned(): Promise<void> {
    try {
      const deleted = await this.repository.deleteAbandonedCreated();
      if (deleted > 0) {
        this.logger.log(`abandoned games deleted ::: ${deleted}`);
      }
    } catch (e) {
      this.logger.error(`cleanupAbandoned failed ::: ${e}`);
    }
  }
}

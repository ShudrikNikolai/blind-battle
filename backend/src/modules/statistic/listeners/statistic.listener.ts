import { Injectable, Logger } from '@nestjs/common';
import { StatisticGameService } from '../game/statistic-game.service';
import { StatisticUserService } from '../user/statistic-user.service';
import { OnEvent } from '@nestjs/event-emitter';
import {
  STATISTIC_UPDATE_EVENT,
  type StatisticUpdateEvent,
} from '@/common/events/statistic.event';

@Injectable()
export class StatisticListener {
  private readonly logger = new Logger(StatisticListener.name);

  constructor(
    private readonly statGameService: StatisticGameService,
    private readonly statUserService: StatisticUserService,
  ) {}

  @OnEvent(STATISTIC_UPDATE_EVENT)
  async onStatUpdate(e: StatisticUpdateEvent): Promise<void> {
    try {
      const promises = [
        this.statGameService.save(e),
        this.statUserService.updateStats(e),
      ];

      await Promise.all(promises);
    } catch (err) {
      this.logger.error(
        `STATISTIC_UPDATE_EVENT failed ::: ${e.gameId} ::: ${err}`,
      );
    }
  }
}

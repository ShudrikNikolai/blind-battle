import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { GAME_QUEUE } from '../consts';
import { GameService } from '../core/game.service';

@Processor(GAME_QUEUE)
export class GameProcessor extends WorkerHost {
  constructor(private readonly game: GameService) {
    super();
  }

  async process(job: Job<{ gameId: string }>): Promise<void> {
    await this.game.finish(job.data.gameId);
  }
}

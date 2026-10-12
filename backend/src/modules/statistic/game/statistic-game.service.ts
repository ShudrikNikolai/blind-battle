import { Injectable } from '@nestjs/common';
import { StatisticGameRepository } from './statistic-game.repository';

interface IStatisticGame {
  gameId: string;
  authorCorrect: boolean[];
  rivalCorrect: boolean[];
}

@Injectable()
export class StatisticGameService {
  constructor(private readonly repository: StatisticGameRepository) {}

  async save(data: IStatisticGame): Promise<void> {
    await this.repository.create(data);
  }
}

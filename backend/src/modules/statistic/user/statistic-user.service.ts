import { Injectable } from '@nestjs/common';
import { StatisticUserRepository } from './statistic-user.repository';

interface IStatisticUser {
  authorId: string;
  rivalId: string;
  winner: string;
}

@Injectable()
export class StatisticUserService {
  constructor(private readonly repository: StatisticUserRepository) {}

  async updateStats(data: IStatisticUser): Promise<void> {
    const promises = this.statsUpdateUserInc(data);
    if (!promises) return;
    try {
      await Promise.all(promises);
    } catch (err) {
      console.log(err)
    }
  }

  private statsUpdateUserInc(e: IStatisticUser) {
    switch (e.winner) {
      case 'author': {
        return [
          this.repository.incWins(e.authorId),
          this.repository.incLosses(e.rivalId),
        ];
      }
      case 'rival': {
        return [
          this.repository.incWins(e.rivalId),
          this.repository.incLosses(e.authorId),
        ];
      }
      case 'draw': {
        return [
          this.repository.incDraws(e.rivalId),
          this.repository.incDraws(e.authorId),
        ];
      }
    }
  }
}

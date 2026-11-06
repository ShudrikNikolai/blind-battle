import { Injectable } from '@nestjs/common';
import type { UserStatsDto } from '../dtos/statistic-user.dto';
import { StatisticUserRepository } from './statistic-user.repository';

interface IStatisticUser {
  authorId: string;
  rivalId: string;
  winner: string;
}

@Injectable()
export class StatisticUserService {
  constructor(private readonly repository: StatisticUserRepository) {}

  async getStats(userId: string): Promise<UserStatsDto> {
    const stats = await this.repository.findByUserId(userId);
    return {
      wins: stats?.wins ?? 0,
      losses: stats?.losses ?? 0,
      draws: stats?.draws ?? 0,
    };
  }

  async updateStats(data: IStatisticUser): Promise<void> {
    const promises = this.statsUpdateUserInc(data);
    if (!promises) return;
    await Promise.all(promises);
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

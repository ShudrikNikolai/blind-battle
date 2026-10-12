import { TypeOrmRepository } from '@/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatisticUserEntity } from './statistic-user.entity';

const INCREMENT_VALUE = 1;

@Injectable()
export class StatisticUserRepository extends TypeOrmRepository<StatisticUserEntity> {
  constructor(
    @InjectRepository(StatisticUserEntity)
    protected readonly repository: Repository<StatisticUserEntity>,
  ) {
    super(repository);
  }

  async incLosses(userId: string): Promise<void> {
    this.repository.increment(
      {
        userId,
      },
      'losses',
      INCREMENT_VALUE,
    );
  }

  async incWins(userId: string): Promise<void> {
    this.repository.increment(
      {
        userId,
      },
      'wins',
      INCREMENT_VALUE,
    );
  }

  async incDraws(userId: string): Promise<void> {
    this.repository.increment(
      {
        userId,
      },
      'draws',
      INCREMENT_VALUE,
    );
  }
}

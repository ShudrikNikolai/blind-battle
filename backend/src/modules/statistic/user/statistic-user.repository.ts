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

  findByUserId(userId: string): Promise<StatisticUserEntity | null> {
    return this.findOne({ filter: { userId } });
  }

  async incLosses(userId: string): Promise<void> {
    await this.increment(userId, 'losses');
  }

  async incWins(userId: string): Promise<void> {
    await this.increment(userId, 'wins');
  }

  async incDraws(userId: string): Promise<void> {
    await this.increment(userId, 'draws');
  }

  private async increment(
    userId: string,
    column: 'wins' | 'losses' | 'draws',
  ): Promise<void> {
    const table = this.repository.metadata.tableName;
    await this.repository.query(
      `INSERT INTO "${table}" (user_id, ${column}) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET ${column} = "${table}".${column} + $2, updated_at = now()`,
      [userId, INCREMENT_VALUE],
    );
  }
}

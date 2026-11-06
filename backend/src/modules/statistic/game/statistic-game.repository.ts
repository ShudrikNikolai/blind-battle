import { TypeOrmRepository } from '@/common';
import { Injectable } from '@nestjs/common';
import { StatisticGameEntity } from './statistic-game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class StatisticGameRepository extends TypeOrmRepository<StatisticGameEntity> {
  constructor(
    @InjectRepository(StatisticGameEntity)
    protected readonly repository: Repository<StatisticGameEntity>,
  ) {
    super(repository);
  }

  // game.finished может прийти повторно дубль по game_id не создаём
  async saveIfAbsent(data: {
    gameId: string;
    authorCorrect: boolean[];
    rivalCorrect: boolean[];
  }): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(StatisticGameEntity)
      .values(data)
      .orIgnore()
      .execute();
  }
}

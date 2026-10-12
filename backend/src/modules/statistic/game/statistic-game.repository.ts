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
}

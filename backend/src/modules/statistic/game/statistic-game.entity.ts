import { BaseEntity } from '@/common';
import { Column, Entity } from 'typeorm';

@Entity('statistic_games')
export class StatisticGameEntity extends BaseEntity {
  @Column({
    name: 'game_id',
    type: 'uuid',
    unique: true,
  })
  gameId: string;

  @Column({
    name: 'author_correct',
    type: 'boolean',
    array: true,
  })
  authorCorrect: boolean[];

  @Column({
    name: 'rival_correct',
    type: 'boolean',
    array: true,
  })
  rivalCorrect: boolean[];
}

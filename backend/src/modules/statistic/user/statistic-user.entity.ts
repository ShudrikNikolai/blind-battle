import { BaseEntity } from '@/common';
import { UserEntity } from '../../user/user.entity';
import { Column, Entity, JoinColumn, OneToOne, type Relation } from 'typeorm';

@Entity('statistic_users')
export class StatisticUserEntity extends BaseEntity {
  @Column({
    name: 'user_id',
    type: 'uuid',
    unique: true,
  })
  userId: string;

  @OneToOne(() => UserEntity, (u) => u.stats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserEntity>;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ default: 0 })
  draws: number;
}

import { BaseEntity } from '@/common';
import { Column, Entity, OneToMany, OneToOne, type Relation } from 'typeorm';
import { StatisticUserEntity } from '../statistic/user/statistic-user.entity';
import { NotificationEntity } from '../notification/notification.entity';
import { UserDto } from './user.dto';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({
    name: 'telegram_id',
    type: 'bigint',
    unique: true,
  })
  telegramId: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({
    name: 'user_name',
    type: 'varchar',
    nullable: true,
  })
  userName: string | null;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    nullable: true,
  })
  phoneNumber: string | null;

  @Column({
    name: 'is_confirmed',
    default: false,
  })
  isConfirmed: boolean;

  @OneToOne(() => StatisticUserEntity, (s) => s.user)
  stats: Relation<StatisticUserEntity>;

  @OneToMany(() => NotificationEntity, (n) => n.user)
  notifications: Relation<NotificationEntity[]>;

  getPublic(): UserDto {
    return {
      id: this.id,
      telegramId: this.telegramId,
      firstName: this.firstName,
      userName: this.userName,
      isConfirmed: this.isConfirmed,
    };
  }
}

import { BaseEntity } from '@/common';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('notifications')
@Index(['isSend'])
export class NotificationEntity extends BaseEntity {
  @Column({ type: 'text' })
  text: string;

  @Column({
    name: 'is_send',
    default: false,
  })
  isSend: boolean;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: string;

  @ManyToOne(() => UserEntity, (u) => u.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserEntity>;
}

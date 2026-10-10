import { BaseEntity } from '@/common';
import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AdminEntity } from '../core/admin.entity';
import { type QuizSnapshot } from '../ports/quiz.port';
import { QuizDto } from '../dtos/quiz.dto';

@Entity('quizzes')
export class QuizEntity extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'jsonb' })
  content: QuizSnapshot;

  @Column({
    name: 'is_published',
    default: false,
  })
  isPublished: boolean;

  @Column({
    name: 'admin_id',
    type: 'uuid',
  })
  adminId: string;

  @ManyToOne(() => AdminEntity, (a) => a.quizzes)
  @JoinColumn({ name: 'admin_id' })
  admin: Relation<AdminEntity>;

  getPublic(): QuizDto {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      isPublished: this.isPublished,
      createdAt: this.createdAt,
    };
  }
}

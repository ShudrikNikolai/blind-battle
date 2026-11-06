import { BaseEntity } from '@/common';
import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AdminEntity } from '../core/admin.entity';
import { type QuizSnapshot } from '@/common/contracts/quiz';
import { TagEntity } from '../tag/tag.entity';
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

  @Column({
    name: 'tag_id',
    type: 'uuid',
  })
  tagId: string;

  @ManyToOne(() => TagEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tag_id' })
  tag: Relation<TagEntity>;

  getPublic(): QuizDto {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      isPublished: this.isPublished,
      tagId: this.tagId,
      tag: this.tag ? this.tag.getPublic() : null,
      createdAt: this.createdAt,
    };
  }
}

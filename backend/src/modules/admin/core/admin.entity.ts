import { BaseEntity } from '@/common';
import { Column, Entity, OneToMany, type Relation } from 'typeorm';
import { QuizEntity } from '../quiz/quiz.entity';
import { AdminResponseDto } from '../dtos/admin.dto';

@Entity('admins')
export class AdminEntity extends BaseEntity {
  @Column({ unique: true })
  login: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @OneToMany(() => QuizEntity, (q) => q.admin)
  quizzes: Relation<QuizEntity[]>;

  getPublic(): AdminResponseDto {
    return {
      id: this.id,
      login: this.login,
    };
  }
}

import { BaseEntity, TypeOrmRepository } from '@/common';
import { Injectable } from '@nestjs/common';
import { QuizEntity } from './quiz.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class QuizRepository extends TypeOrmRepository<QuizEntity> {
  constructor(
    @InjectRepository(QuizEntity)
    protected readonly repository: Repository<QuizEntity>,
  ) {
    super(repository);
  }

  async findRandomPublished(): Promise<QuizEntity | null> {
    return this.repository
      .createQueryBuilder('q')
      .where('q.isPublished = true')
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
  }
}

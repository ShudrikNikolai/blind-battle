import { TypeOrmRepository } from '@/common';
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

  async findRandomPublished(tagId?: string): Promise<QuizEntity | null> {
    const query = this.repository
      .createQueryBuilder('q')
      .innerJoin('q.tag', 't')
      .where('q.isPublished = true')
      .andWhere('t.isPublished = true')
      .andWhere('t.deletedAt IS NULL');

    if (tagId) {
      query.andWhere('q.tagId = :tagId', { tagId });
    }

    return query.orderBy('RANDOM()').limit(1).getOne();
  }
}

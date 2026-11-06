import { TypeOrmRepository } from '@/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizEntity } from '../quiz/quiz.entity';
import { TagEntity } from './tag.entity';

@Injectable()
export class TagRepository extends TypeOrmRepository<TagEntity> {
  constructor(
    @InjectRepository(TagEntity)
    protected readonly repository: Repository<TagEntity>,
  ) {
    super(repository);
  }

  findByName(name: string): Promise<TagEntity | null> {
    return this.repository
      .createQueryBuilder('t')
      .where('lower(t.name) = lower(:name)', { name })
      .andWhere('t.deletedAt IS NULL')
      .getOne();
  }

  //Опубликованные теги, у которых есть хотя бы один опубликованный квиз
  findPublishedWithQuizzes(): Promise<TagEntity[]> {
    return this.repository
      .createQueryBuilder('t')
      .where('t.isPublished = true')
      .andWhere('t.deletedAt IS NULL')
      .andWhere(
        `EXISTS (
          SELECT 1 FROM quizzes q
          WHERE q.tag_id = t.id
            AND q.is_published = true
            AND q.deleted_at IS NULL
        )`,
      )
      .orderBy('t.name', 'ASC')
      .getMany();
  }

  //Unpublish тега + всех его квизов и soft delete тега
  async softDeleteAndUnpublish(id: string): Promise<boolean> {
    return this.repository.manager.transaction(async (manager) => {
      const tag = await manager.findOne(TagEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!tag) return false;

      await manager.update(QuizEntity, { tagId: id }, { isPublished: false });
      await manager.softDelete(TagEntity, id);
      return true;
    });
  }

  //Смена публикации тега
  async setPublished(
    id: string,
    isPublished: boolean,
  ): Promise<TagEntity | null> {
    return this.repository.manager.transaction(async (manager) => {
      const tag = await manager.findOne(TagEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!tag) return null;

      await manager.update(TagEntity, id, { isPublished });
      if (!isPublished) {
        await manager.update(QuizEntity, { tagId: id }, { isPublished: false });
      }

      return Object.assign(tag, { isPublished });
    });
  }
}

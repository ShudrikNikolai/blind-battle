import { BaseEntity } from '@/common';
import { Column, Entity } from 'typeorm';
import { TagDto } from '../dtos/tag.dto';

@Entity('tags')
export class TagEntity extends BaseEntity {
  @Column({ length: 64 })
  name: string;

  @Column({
    name: 'is_published',
    default: false,
  })
  isPublished: boolean;

  getPublic(): TagDto {
    return {
      id: this.id,
      name: this.name,
      isPublished: this.isPublished,
      createdAt: this.createdAt,
    };
  }
}

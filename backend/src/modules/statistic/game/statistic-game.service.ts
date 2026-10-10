import { BaseEntity } from '@/common';
import { Entity } from 'typeorm';

@Entity('ratings')
export class RatingEntity extends BaseEntity {}

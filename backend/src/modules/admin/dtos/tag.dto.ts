import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'Программирование', maxLength: 64 })
  @IsString()
  @Length(1, 64)
  name: string;
}

export class UpdateTagDto extends PartialType(CreateTagDto) {}

export class PublishTagDto {
  @ApiProperty({
    description:
      'true: тег можно привязывать к квизам; false: связанные квизы снимаются с публикации',
  })
  @IsBoolean()
  isPublished: boolean;
}

export class ListTagQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ description: 'Фильтр по публикации' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPublished?: boolean;
}

export class TagDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Программирование' })
  name: string;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

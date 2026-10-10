import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const QUIZ_CONTENT_EXAMPLE = {
  timeLimitSec: 120,
  questions: [
    {
      question: 'Какой тип хранит JSON в бинарном виде?',
      buttons: [
        { text: 'json', isCorrectAnswer: false },
        { text: 'jsonb', isCorrectAnswer: true },
        { text: 'text', isCorrectAnswer: false },
      ],
    },
  ],
};

export class QuizButtonDto {
  @ApiProperty({ example: 'jsonb', maxLength: 64 })
  @IsString()
  @Length(1, 64)
  text: string;

  @ApiProperty({ description: 'В каждом вопросе ровно одна верная кнопка' })
  @IsBoolean()
  isCorrectAnswer: boolean;
}

export class QuizQuestionDto {
  @ApiProperty({ example: 'Что делает VACUUM?', maxLength: 500 })
  @IsString()
  @Length(1, 500)
  question: string;

  @ApiProperty({ type: () => [QuizButtonDto], minItems: 2, maxItems: 4 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => QuizButtonDto)
  buttons: QuizButtonDto[];
}

export class QuizContentDto {
  @ApiProperty({ type: () => [QuizQuestionDto], minItems: 1, maxItems: 30 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];

  @ApiProperty({
    example: 120,
    minimum: 10,
    maximum: 3600,
    description: 'Время на весь квиз, секунды',
  })
  @IsInt()
  @Min(10)
  @Max(3600)
  timeLimitSec: number;
}

export class CreateQuizDto {
  @ApiProperty({ example: 'Postgres для разработчика', maxLength: 200 })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({ type: QuizContentDto, example: QUIZ_CONTENT_EXAMPLE })
  @ValidateNested()
  @Type(() => QuizContentDto)
  content: QuizContentDto;
}

export class UpdateQuizDto extends PartialType(CreateQuizDto) {}

export class PublishQuizDto {
  @ApiProperty({
    description: 'true: квиз попадает в игры, false: снимается с публикации',
  })
  @IsBoolean()
  isPublished: boolean;
}

export class ListQuizQueryDto {
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    description: 'Номер страницы',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Размер страницы',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export class QuizDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Основы TypeScript' })
  title: string;

  @ApiProperty({ type: QuizContentDto })
  content: QuizContentDto;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

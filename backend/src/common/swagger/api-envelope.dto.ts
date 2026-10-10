import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiEnvelopeDto {
  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-10T12:00:00.000Z',
  })
  timestamp: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Непустые query-параметры запроса (или null)',
  })
  query?: Record<string, unknown> | null;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
  @ApiProperty({ example: 42 }) total: number;
  @ApiProperty({ example: 3 }) totalPages: number;
  @ApiProperty({ example: true }) hasNextPage: boolean;
  @ApiProperty({ example: false }) hasPrevPage: boolean;
}

export class ApiPaginatedEnvelopeDto extends ApiEnvelopeDto {
  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class ApiErrorBodyDto {
  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({
    type: [String],
    example: ['login must be shorter than or equal to 64 characters'],
    description: 'Детали (для ошибок валидации); иначе пустой массив',
  })
  details: string[];
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 }) status: number;
  @ApiProperty({ type: ApiErrorBodyDto }) errors: ApiErrorBodyDto;
  @ApiProperty({ type: String, format: 'date-time' }) timestamp: string;
  @ApiProperty({ example: '/quiz' }) path: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['login must be longer than or equal to 3 characters'],
    description: 'Текст ошибки или список ошибок валидации',
  })
  message: string | string[];

  @ApiProperty({ example: '2026-10-10T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/admin/login' })
  path: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin', minLength: 1, maxLength: 64 })
  @IsString()
  @Length(1, 64)
  login: string;

  @ApiProperty({
    example: 'admin',
    format: 'password',
    minLength: 1,
    maxLength: 128,
  })
  @IsString()
  @Length(1, 128)
  password: string;
}

export class CreateAdminDto {
  @ApiProperty({
    example: 'editor',
    minLength: 3,
    maxLength: 64,
    description: 'Уникальный логин',
  })
  @IsString()
  @Length(3, 64)
  login: string;

  @ApiProperty({
    example: 'str0ng-pass',
    format: 'password',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @Length(8, 128)
  password: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ format: 'password', minLength: 1, maxLength: 128 })
  @IsString()
  @Length(1, 128)
  oldPassword: string;

  @ApiProperty({
    format: 'password',
    minLength: 8,
    maxLength: 128,
    description: 'Должен отличаться от старого',
  })
  @IsString()
  @Length(8, 128)
  newPassword: string;
}

export class AdminResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin' })
  login: string;
}

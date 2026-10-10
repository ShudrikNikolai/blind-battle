import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ApiEnvelope, ApiErrors, ApiProtected } from '@/common/swagger';
import { AdminService } from '../core/admin.service';
import { AuthGuard } from '../guards/auth.guard';
import {
  AdminResponseDto,
  CreateAdminDto,
  LoginDto,
  UpdatePasswordDto,
} from '../dtos/admin.dto';
import { CurrentAdminId, Public } from '../decorators';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Вход администратора',
    description:
      'Проверяет логин и пароль, создаёт новую сессию и выставляет httpOnly cookie. ' +
      'Дальше cookie отправляется автоматически.',
  })
  @ApiBody({ type: LoginDto })
  @ApiEnvelope(AdminResponseDto, {
    description: 'Успешный вход',
    headers: {
      'Set-Cookie': {
        description: 'Сессионная cookie (httpOnly)',
        schema: { type: 'string' },
      },
    },
  })
  @ApiErrors(400, [401, 'Неверный логин или пароль'])
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AdminResponseDto> {
    const admin = await this.adminService.login(dto);
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((e) => (e ? reject(e) : resolve())),
    );
    req.session.adminId = admin.id;
    return admin;
  }

  @Post('logout')
  @HttpCode(200)
  @ApiProtected()
  @ApiOperation({ summary: 'Выход', description: 'Уничтожает текущую сессию.' })
  @ApiEnvelope(undefined, { description: 'Сессия завершена' })
  logout(@Req() req: Request): Promise<void> {
    return new Promise((resolve, reject) =>
      req.session.destroy((e) => (e ? reject(e) : resolve())),
    );
  }

  @Get('me')
  @ApiProtected()
  @ApiOperation({ summary: 'Текущий администратор' })
  @ApiEnvelope(AdminResponseDto)
  async me(@CurrentAdminId() id: string): Promise<AdminResponseDto> {
    const admin = await this.adminService.me(id);
    if (!admin) throw new UnauthorizedException();
    return admin;
  }

  @Patch('upd-pass')
  @ApiProtected()
  @ApiOperation({
    summary: 'Смена пароля',
    description:
      'Меняет пароль текущего администратора (логин берётся из сессии).',
  })
  @ApiEnvelope(undefined, { description: 'Пароль изменён' })
  @ApiErrors(
    [400, 'Валидация или новый пароль совпадает со старым'],
    [403, 'Неверный текущий пароль'],
  )
  async updPass(
    @CurrentAdminId() id: string,
    @Body() dto: UpdatePasswordDto,
  ): Promise<void> {
    await this.adminService.updatePassword(id, dto);
  }

  @Post('new-admin')
  @ApiProtected()
  @ApiOperation({ summary: 'Создать администратора' })
  @ApiEnvelope(AdminResponseDto, {
    status: 201,
    description: 'Администратор создан',
  })
  @ApiErrors(400, [409, 'Логин уже занят или произлшда ошибка'])
  createAdmin(@Body() dto: CreateAdminDto): Promise<AdminResponseDto> {
    return this.adminService.createAdmin(dto);
  }
}

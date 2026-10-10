import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';

export const CurrentAdminId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const adminId = ctx.switchToHttp().getRequest<Request>().session?.adminId;
    if (!adminId)
      throw new InternalServerErrorException(
        'CurrentAdminId used without AuthGuard',
      );
    return adminId;
  },
);

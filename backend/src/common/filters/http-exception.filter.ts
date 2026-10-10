import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const raw = exception.getResponse();
    const message =
      typeof raw === 'string'
        ? raw
        : ((raw as { message?: string | string[] }).message ??
          exception.message);

    res.status(status).json({
      status,
      errors: Array.isArray(message)
        ? { message: 'Validation failed', details: message }
        : { message, details: [] },
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}

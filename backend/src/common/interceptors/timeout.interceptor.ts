import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  catchError,
  Observable,
  throwError,
  timeout,
  TimeoutError,
} from 'rxjs';
import { API_ERROR, API_RESPONSE_TIMEOUT } from '../utils';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(API_RESPONSE_TIMEOUT),

      catchError((error: unknown) => {
        if (!(error instanceof TimeoutError)) {
          return throwError(() => error);
        }

        const request = context.switchToHttp().getRequest();
        const route = request.route?.path;
        const url = request.originalUrl ?? request.url;
        const message = API_ERROR.TIMEOUT;

        // this.logger.warn(
        //   {
        //     method: request.method,
        //     url,
        //     route,
        //     timeout: API_RESPONSE_TIMEOUT,
        //   },
        //   message,
        // );

        return throwError(() => new RequestTimeoutException());
      }),
    );
  }
}

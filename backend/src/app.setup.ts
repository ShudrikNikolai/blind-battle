import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import { setupSwagger } from './common';
import { HttpExceptionFilter } from './common/filters';
import type { TApp, TAuth } from './config';

export async function configureApp(app: NestExpressApplication): Promise<void> {
  const config = app.get(ConfigService);
  const appConf = config.getOrThrow<TApp>('APP');
  const authConf = config.getOrThrow<TAuth>('AUTH');

  app.setGlobalPrefix(appConf.globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: appConf.version,
  });
  app.enableCors({
    origin: appConf.allowedOrigin,
    credentials: appConf.credentials,
  });

  app.set('trust proxy', 1);
  app.use(session(authConf));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  setupSwagger(app, config);
}

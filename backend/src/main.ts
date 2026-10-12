import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe, VersioningType } from '@nestjs/common';
import session from 'express-session';
import { ConfigService } from '@nestjs/config';
import type { TApp, TAuth } from './config';
import { setupSwagger } from './common';
import { HttpExceptionFilter } from './common/filters';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({ json: isProd, colors: !isProd }),
  });

  const appConfSrv = app.get(ConfigService);
  const appConf = appConfSrv.getOrThrow<TApp>('APP');
  const authConf = appConfSrv.getOrThrow<TAuth>('AUTH');

  app.setGlobalPrefix(appConf.globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: appConf.version,
  });
  app.enableCors({
    origin: appConf.allowedOrigin,
    credentials: true,
  });

  app.set('trust proxy', 1);

  app.enableShutdownHooks();

  app.use(session(authConf));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  setupSwagger(app, appConfSrv);

  await app.listen(appConf.port);
}

bootstrap();

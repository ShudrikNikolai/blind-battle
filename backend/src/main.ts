import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import session from 'express-session';
import { ConfigService } from '@nestjs/config';
import type { TApp, TAuth } from './config';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
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
    // credentials: appConf
  });

  app.use(session(authConf));
  app.useGlobalPipes(new ValidationPipe());

  setupSwagger(app, appConfSrv);

  await app.listen(appConf.port);
}
await bootstrap();

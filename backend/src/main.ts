import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import type { TApp } from './config';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({ json: isProd, colors: !isProd }),
  });

  app.enableShutdownHooks();
  await configureApp(app);

  const appConf = app.get(ConfigService).getOrThrow<TApp>('APP');
  await app.listen(appConf.port);
}

bootstrap();

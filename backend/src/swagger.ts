import { INestApplication, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fs from 'fs';
import { TApp, TSwagger } from './config';

export const setupSwagger = (
  app: INestApplication,
  config: ConfigService,
): void => {
  const { name, version } = config.getOrThrow<TApp>('APP');
  const { enable, path, createFile } = config.getOrThrow<TSwagger>('SWAGGER');

  if (!enable) {
    return;
  }

  const documentBuilder = new DocumentBuilder()
    .setTitle(name)
    .setDescription(`${name} API document`)
    .setVersion(version)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    );

  const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
    ignoreGlobalPrefix: false,
    extraModels: [],
  });

  if (createFile) {
    fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  }

  SwaggerModule.setup(path, app, document, {});
};

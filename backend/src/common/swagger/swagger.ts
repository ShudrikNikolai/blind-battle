import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fs from 'fs';
import { TApp, TSwagger } from '../../config';
import { ErrorResponseDto } from './error-response.dto';
import { SESSION_AUTH } from '../utils';
import { PaginationMetaDto } from './api-envelope.dto';

export const setupSwagger = (
  app: INestApplication,
  config: ConfigService,
): void => {
  const { name, version } = config.getOrThrow<TApp>('APP');
  const { enable, createFile } = config.getOrThrow<TSwagger>('SWAGGER');

  if (!enable) {
    return;
  }

  const documentBuilder = new DocumentBuilder()
    .setTitle(name)
    .setDescription(`${name} API document`)
    .setVersion(version)
    .addCookieAuth(
      'connect.sid',
      { type: 'apiKey', in: 'cookie', name: 'connect.sid' },
      SESSION_AUTH,
    )
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilder, {
    extraModels: [ErrorResponseDto, PaginationMetaDto],
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace('Controller', '')}_${methodKey}`,
  });

  if (createFile) {
    fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  }

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Blind Battle API',
    jsonDocumentUrl: 'api/docs/json',
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
    },
  });
};

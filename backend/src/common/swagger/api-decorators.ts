import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ApiEnvelopeDto,
  ApiErrorResponseDto,
  ApiPaginatedEnvelopeDto,
} from './api-envelope.dto';
import { SESSION_AUTH } from '../utils';

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'Ошибка валидации или некорректный запрос',
  401: 'Нет активной сессии',
  403: 'Доступ запрещён',
  404: 'Не найдено',
  409: 'Конфликт',
};

export const ApiErrors = (...items: Array<number | [number, string]>) =>
  applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ...items.map((item) => {
      const [status, description] = Array.isArray(item)
        ? item
        : [item, ERROR_DESCRIPTIONS[item]];
      return ApiResponse({ status, description, type: ApiErrorResponseDto });
    }),
  );

export const ApiProtected = () =>
  applyDecorators(ApiCookieAuth(SESSION_AUTH), ApiErrors(401));

interface EnvelopeOptions {
  status?: number;
  description?: string;
  isArray?: boolean;
  headers?: Record<string, { description?: string; schema?: { type: string } }>;
}

export const ApiEnvelope = (
  model?: Type<unknown>,
  opts: EnvelopeOptions = {},
) => {
  const status = opts.status ?? 200;
  const data = model
    ? opts.isArray
      ? { type: 'array', items: { $ref: getSchemaPath(model) } }
      : { $ref: getSchemaPath(model) }
    : undefined;

  return applyDecorators(
    ApiExtraModels(ApiEnvelopeDto, ...(model ? [model] : [])),
    ApiResponse({
      status,
      description: opts.description,
      headers: opts.headers,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiEnvelopeDto) },
          {
            properties: {
              status: { type: 'number', example: status },
              ...(data ? { data } : {}),
            },
          },
        ],
      },
    }),
  );
};

export const ApiPaginatedEnvelope = (
  model: Type<unknown>,
  description?: string,
) =>
  applyDecorators(
    ApiExtraModels(ApiPaginatedEnvelopeDto, model),
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiPaginatedEnvelopeDto) },
          {
            properties: {
              data: { type: 'array', items: { $ref: getSchemaPath(model) } },
            },
          },
        ],
      },
    }),
  );

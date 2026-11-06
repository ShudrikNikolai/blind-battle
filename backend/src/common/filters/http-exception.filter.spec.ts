import { BadRequestException, Logger } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';

const makeHost = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const req = { method: 'GET', url: '/api/v1/test' };
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => req,
    }),
  } as unknown as ArgumentsHost;
  return { host, res };
};

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  afterEach(() => vi.restoreAllMocks());

  it('keeps the error envelope for HttpException', () => {
    const { host, res } = makeHost();

    filter.catch(new BadRequestException('bad input'), host);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        errors: { message: 'bad input', details: [] },
        path: '/api/v1/test',
      }),
    );
  });

  it('turns unknown errors into a 500 envelope and logs them', () => {
    const errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { host, res } = makeHost();

    filter.catch(new Error('boom'), host);

    expect(errorSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        errors: { message: 'Internal Server Error', details: [] },
      }),
    );
  });
});

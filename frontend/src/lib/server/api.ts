import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { IApiResponse } from '#lib/types/api.ts';
import { config } from './config';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: unknown[] = []
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export function createApi(event: RequestEvent) {
  async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const res = await event.fetch(`${config.apiBase}${path}`, {
      method,
      headers: {
        cookie: event.request.headers.get('cookie') ?? '',
        accept: 'application/json',
        ...(body !== undefined && { 'content-type': 'application/json' })
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json().catch(() => null)) as Record<string, any> | null;

    if (res.status === 401) {
      event.cookies.delete(config.cookieName, { path: '/' });
      throw redirect(303, '/login');
    }

    if (!res.ok) {
      const e = (json as IApiResponse | null)?.errors;

      const msg = e?.message ?? (typeof json?.message === 'string' ? json.message : undefined);
      const details = e?.details ?? (Array.isArray(json?.message) ? json.message : []);
      throw new ApiError(res.status, msg ?? res.statusText ?? 'Ошибка запроса', details);
    }

    return json as T;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body),
    patch: <T = unknown>(path: string, body?: unknown) => request<T>('PATCH', path, body)
  };
}

export function apiFail<X extends Record<string, unknown> = Record<string, never>>(
  e: unknown,
  extra?: X
) {
  if (e instanceof ApiError) {
    return fail(e.status >= 400 && e.status < 600 ? e.status : 400, {
      message: e.message,
      details: e.details,
      ...(extra as X)
    });
  }
  throw e;
}

export async function orError<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError) throw error(e.status, e.message);
    throw e;
  }
}

import type { Admin, IApiResponse } from '#lib/types/api.ts';
import { config } from './config';

export async function fetchSessionUser(
  fetchFn: typeof fetch,
  cookieHeader: string
): Promise<Admin | null> {
  try {
    const res = await fetchFn(`${config.apiBase}/admin/me`, {
      headers: { cookie: cookieHeader, accept: 'application/json' }
    });
    if (!res.ok) return null;

    const body = (await res.json()) as IApiResponse<Admin>;
    return body.data ?? null;
  } catch {
    return null;
  }
}

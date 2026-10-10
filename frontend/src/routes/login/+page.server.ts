import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { IApiResponse } from '#lib/types/api.ts';
import { config } from '#lib/server/config.ts';
import { forwardSetCookie } from '#lib/server/cookies.ts';

export const actions: Actions = {
  default: async ({ request, fetch, cookies }) => {
    const form = await request.formData();
    const login = String(form.get('login') ?? '').trim();
    const password = String(form.get('password') ?? '');

    let res: Response;
    try {
      res = await fetch(`${config.apiBase}/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ login, password })
      });
    } catch {
      return fail(503, { login, message: 'Сервер недоступен', details: [] as unknown[] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await res.json().catch(() => null)) as Record<string, any> | null;

    if (!res.ok) {
      const e = (body as IApiResponse | null)?.errors;
      return fail(res.status, {
        login,
        message:
          e?.message ?? (typeof body?.message === 'string' ? body.message : 'Не удалось войти'),
        details: (e?.details ?? (Array.isArray(body?.message) ? body.message : [])) as unknown[]
      });
    }

    forwardSetCookie(res, cookies);
    throw redirect(303, '/dashboard');
  }
};

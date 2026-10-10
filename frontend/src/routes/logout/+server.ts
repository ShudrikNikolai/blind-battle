import { redirect, type RequestHandler } from '@sveltejs/kit';
import { createApi } from '#lib/server/api.ts';
import { config } from '#lib/server/config.ts';

export const POST: RequestHandler = async (event) => {
  // сессию на бэкенде гасим, но куку удаляем в любом случае
  try {
    await createApi(event).post('/admin/logout');
  } catch (e) {
    console.error('failed', e)
  }

  event.cookies.delete(config.cookieName, { path: '/' });
  throw redirect(303, '/login');
};

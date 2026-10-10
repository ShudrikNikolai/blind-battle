import { redirect } from '@sveltejs/kit';
import { config } from '#lib/server/config.ts';
import { fetchSessionUser } from '#lib/server/auth.ts';
import type { Handle } from '@sveltejs/kit/hooks';

const PUBLIC_PATHS = ['/login'];
const isPublic = (path: string) => PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

export const handle: Handle = async ({ event, resolve }) => {
  const hasCookie = !!event.cookies.get(config.cookieName);

  event.locals.user = hasCookie
    ? await fetchSessionUser(fetch, event.request.headers.get('cookie') ?? '')
    : null;

  // протухшая/невалидная кука — чистим
  if (hasCookie && !event.locals.user) {
    event.cookies.delete(config.cookieName, { path: '/' });
  }

  const { pathname } = event.url;

  if (!event.locals.user && !isPublic(pathname)) {
    throw redirect(303, '/login');
  }
  if (event.locals.user && isPublic(pathname)) {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};

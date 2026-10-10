import type { Cookies } from '@sveltejs/kit';
import { parse } from 'set-cookie-parser';

export function forwardSetCookie(res: Response, cookies: Cookies) {
  const parsed = parse(res.headers.getSetCookie(), { decodeValues: false });

  for (const c of parsed) {
    cookies.set(c.name, c.value, {
      path: c.path ?? '/',
      domain: c.domain,
      httpOnly: c.httpOnly ?? true,
      secure: c.secure ?? process.env.NODE_ENV === 'production',
      sameSite: (c.sameSite?.toLowerCase() as 'lax' | 'strict' | 'none' | undefined) ?? 'lax',
      maxAge: c.maxAge,
      expires: c.expires,
      encode: (v) => v
    });
  }
}

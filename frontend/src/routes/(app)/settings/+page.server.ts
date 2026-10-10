import type { Actions } from './$types';
import { apiFail, createApi } from '#lib/server/api.ts';

export const actions: Actions = {
  password: async (event) => {
    const f = await event.request.formData();
    try {
      await createApi(event).patch('/admin/upd-pass', {
        oldPassword: String(f.get('oldPassword') ?? ''),
        newPassword: String(f.get('newPassword') ?? '')
      });
    } catch (e) {
      return apiFail(e, { form: 'password' as const });
    }
    return { form: 'password' as const, ok: true };
  },

  admin: async (event) => {
    const f = await event.request.formData();
    try {
      await createApi(event).post('/admin/new-admin', {
        login: String(f.get('login') ?? '').trim(),
        password: String(f.get('password') ?? '')
      });
    } catch (e) {
      return apiFail(e, { form: 'admin' as const });
    }
    return { form: 'admin' as const, ok: true };
  }
};

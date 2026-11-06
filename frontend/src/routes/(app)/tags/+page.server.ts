import type { Actions, PageServerLoad } from './$types';
import type { IPaginatedResponse, Tag } from '#lib/types/api.ts';
import { apiFail, createApi, orError } from '#lib/server/api.ts';

export const load: PageServerLoad = async (event) => {
  const res = await orError(
    createApi(event).get<IPaginatedResponse<Tag>>('/tag/all?page=1&limit=100')
  );

  return { tags: res.data, meta: res.meta };
};

export const actions: Actions = {
  create: async (event) => {
    const f = await event.request.formData();
    try {
      await createApi(event).post('/tag', {
        name: String(f.get('name') ?? '').trim()
      });
    } catch (e) {
      return apiFail(e);
    }
    return { saved: true };
  },

  rename: async (event) => {
    const f = await event.request.formData();
    const id = String(f.get('id') ?? '');
    try {
      await createApi(event).patch(`/tag/${id}`, {
        name: String(f.get('name') ?? '').trim()
      });
    } catch (e) {
      return apiFail(e);
    }
    return { saved: true };
  },

  publish: async (event) => {
    const f = await event.request.formData();
    const id = String(f.get('id') ?? '');
    const isPublished = f.get('isPublished') === 'true';
    try {
      await createApi(event).patch(`/tag/${id}/publish`, { isPublished });
    } catch (e) {
      return apiFail(e);
    }
    return { saved: true };
  },

  delete: async (event) => {
    const f = await event.request.formData();
    const id = String(f.get('id') ?? '');
    try {
      await createApi(event).del(`/tag/${id}`);
    } catch (e) {
      return apiFail(e);
    }
    return { saved: true };
  }
};

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { IApiResponse, IPaginatedResponse, Quiz, Tag } from '#lib/types/api.ts';
import { apiFail, createApi, orError } from '#lib/server/api.ts';

export const load: PageServerLoad = async (event) => {
  const tags = await orError(
    createApi(event).get<IPaginatedResponse<Tag>>('/tag/all?isPublished=true&limit=100')
  );

  return { tags: tags.data };
};

export const actions: Actions = {
  default: async (event) => {
    const raw = String((await event.request.formData()).get('payload') ?? '');
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return fail(400, { message: 'Некорректные данные формы', details: [] as unknown[] });
    }

    let id: string | undefined;
    try {
      const res = await createApi(event).post<IApiResponse<Quiz>>('/quiz', body);
      id = res.data?.id;
    } catch (e) {
      return apiFail(e);
    }

    throw redirect(303, id ? `/quiz/${id}` : '/dashboard');
  }
};

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { IApiResponse, Quiz } from '#lib/types/api.ts';
import { apiFail, createApi, orError } from '#lib/server/api.ts';

export const load: PageServerLoad = async (event) => {
  const res = await orError(createApi(event).get<IApiResponse<Quiz>>(`/quiz/${event.params.id}`));
  console.log('res >>>', res)
  return { quiz: res.data! };
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

    try {
      await createApi(event).patch(`/quiz/${event.params.id}`, body);
    } catch (e) {
      return apiFail(e);
    }
    return { saved: true };
  }
};

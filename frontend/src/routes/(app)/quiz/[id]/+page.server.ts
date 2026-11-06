import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { IApiResponse, IPaginatedResponse, Quiz, Tag } from '#lib/types/api.ts';
import { apiFail, createApi, orError } from '#lib/server/api.ts';

export const load: PageServerLoad = async (event) => {
  const [quiz, tags] = await Promise.all([
    orError(createApi(event).get<IApiResponse<Quiz>>(`/quiz/${event.params.id}`)),
    orError(createApi(event).get<IPaginatedResponse<Tag>>('/tag/all?isPublished=true&limit=100'))
  ]);

  return { quiz: quiz.data!, tags: tags.data };
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

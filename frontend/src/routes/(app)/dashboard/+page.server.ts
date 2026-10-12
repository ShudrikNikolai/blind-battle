import type { Actions, PageServerLoad } from './$types';
import type { IPaginatedResponse, Quiz } from '#lib/types/api.ts';
import { apiFail, createApi, orError } from '#lib/server/api.ts';

const LIMIT = 20;

export const load: PageServerLoad = async (event) => {
  const page = Math.max(1, Number(event.url.searchParams.get('page')) || 1);
  const res = await orError(
    createApi(event).get<IPaginatedResponse<Quiz>>(`/quiz/all?page=${page}&limit=${LIMIT}`)
  );

  return { quizzes: res.data, meta: res.meta };
};

export const actions: Actions = {
  publish: async (event) => {
    const f = await event.request.formData();
    const id = String(f.get('id') ?? '');
    const isPublished = f.get('isPublished') === 'true';
    try {
      await createApi(event).patch(`/quiz/${id}/publish`, { isPublished });
    } catch (e) {
      return apiFail(e);
    }
  }
};

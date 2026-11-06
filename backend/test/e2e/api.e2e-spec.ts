import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createE2eApp } from './create-app';

describe('HTTP API (Postgres)', () => {
  let app: NestExpressApplication;
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await createE2eApp();
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app?.close();
  });

  it('reports health', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body.status).toBe(200);
    expect(res.body.data).toEqual({ status: 'ok' });
  });

  it('rejects a wrong admin password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/login')
      .send({ login: 'admin', password: 'wrong-password' })
      .expect(401);
  });

  it('logs the seeded admin in and keeps the session cookie', async () => {
    const res = await agent
      .post('/api/v1/admin/login')
      .send({ login: 'admin', password: 'admin12345' })
      .expect(200);

    expect(res.body.data).toEqual({ id: expect.any(String), login: 'admin' });
    expect(res.headers['set-cookie']).toBeDefined();

    const me = await agent.get('/api/v1/admin/me').expect(200);
    expect(me.body.data.login).toBe('admin');
  });

  it('unpublishes linked quizzes when a tag is unpublished or deleted', async () => {
    const tag = await agent
      .post('/api/v1/tag')
      .send({ name: `E2E topic ${Date.now()}` })
      .expect(201);
    const tagId = tag.body.data.id as string;
    expect(tag.body.data.isPublished).toBe(false);

    const draftPayload = {
      title: 'Tag lifecycle draft',
      tagId,
      content: {
        timeLimitSec: 60,
        questions: [
          {
            question: 'Tag?',
            buttons: [
              { text: 'yes', isCorrectAnswer: true },
              { text: 'no', isCorrectAnswer: false },
            ],
          },
        ],
      },
    };

    // К неопубликованному тегу привязать квиз нельзя.
    await agent.post('/api/v1/quiz').send(draftPayload).expect(400);

    await agent
      .patch(`/api/v1/tag/${tagId}/publish`)
      .send({ isPublished: true })
      .expect(200);

    const quiz = await agent.post('/api/v1/quiz').send(draftPayload).expect(201);
    const quizId = quiz.body.data.id as string;
    expect(quiz.body.data.tagId).toBe(tagId);

    await agent
      .patch(`/api/v1/quiz/${quizId}/publish`)
      .send({ isPublished: true })
      .expect(200);

    // Unpublish тега снимает с публикации связанный квиз.
    await agent
      .patch(`/api/v1/tag/${tagId}/publish`)
      .send({ isPublished: false })
      .expect(200);

    const unpublished = await agent
      .get(`/api/v1/quiz/${quizId}`)
      .expect(200);
    expect(unpublished.body.data.isPublished).toBe(false);

    // Мягкое удаление тега тоже снимает квиз с публикации.
    await agent.patch(`/api/v1/tag/${tagId}/publish`).send({ isPublished: true }).expect(200);
    await agent.patch(`/api/v1/quiz/${quizId}/publish`).send({ isPublished: true }).expect(200);
    await agent.delete(`/api/v1/tag/${tagId}`).expect(200);

    const afterDelete = await agent.get(`/api/v1/quiz/${quizId}`).expect(200);
    expect(afterDelete.body.data.isPublished).toBe(false);
    await agent.get(`/api/v1/tag/${tagId}`).expect(404);
  });

  it('creates, lists, publishes and reads a quiz', async () => {
    const tags = await agent
      .get('/api/v1/tag/all?isPublished=true&limit=100')
      .expect(200);
    const tagId = tags.body.data[0].id as string;

    const created = await agent
      .post('/api/v1/quiz')
      .send({
        title: 'E2E quiz',
        tagId,
        content: {
          timeLimitSec: 60,
          questions: [
            {
              question: '2 + 2?',
              buttons: [
                { text: '4', isCorrectAnswer: true },
                { text: '5', isCorrectAnswer: false },
              ],
            },
          ],
        },
      })
      .expect(201);

    const id = created.body.data.id as string;
    expect(created.body.data.isPublished).toBe(false);

    const list = await agent
      .get('/api/v1/quiz/all?page=1&limit=10')
      .expect(200);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(list.body.data.map((q: { id: string }) => q.id)).toContain(id);

    const published = await agent
      .patch(`/api/v1/quiz/${id}/publish`)
      .send({ isPublished: true })
      .expect(200);
    expect(published.body.data.isPublished).toBe(true);

    const one = await agent.get(`/api/v1/quiz/${id}`).expect(200);
    expect(one.body.data.title).toBe('E2E quiz');
  });

  it('requires a session for protected routes', async () => {
    await request(app.getHttpServer()).get('/api/v1/quiz/all').expect(401);
  });
});

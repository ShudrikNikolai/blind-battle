import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameRepository } from '@/modules/game/core/game.repository';
import { GameService } from '@/modules/game/core/game.service';
import { StatisticUserService } from '@/modules/statistic/user/statistic-user.service';
import { UserService } from '@/modules/user/core/user.service';
import { createE2eApp } from './create-app';

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('Game flow (Postgres + Redis)', () => {
  let app: NestExpressApplication;
  let games: GameService;
  let gameRepository: GameRepository;
  let stats: StatisticUserService;
  let tagId: string;
  let users: UserService;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createE2eApp();
    games = app.get(GameService);
    gameRepository = app.get(GameRepository);
    stats = app.get(StatisticUserService);
    users = app.get(UserService);
    dataSource = app.get(DataSource);

    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/v1/admin/login')
      .send({ login: 'admin', password: 'admin12345' })
      .expect(200);

    const tag = await agent
      .post('/api/v1/tag')
      .send({ name: `Game E2E topic ${Date.now()}` })
      .expect(201);
    tagId = tag.body.data.id as string;
    await agent
      .patch(`/api/v1/tag/${tagId}/publish`)
      .send({ isPublished: true })
      .expect(200);

    const created = await agent
      .post('/api/v1/quiz')
      .send({
        title: 'Game E2E quiz',
        tagId,
        content: {
          timeLimitSec: 60,
          questions: [
            {
              question: '1 + 1?',
              buttons: [
                { text: '2', isCorrectAnswer: true },
                { text: '3', isCorrectAnswer: false },
              ],
            },
          ],
        },
      })
      .expect(201);

    await agent
      .patch(`/api/v1/quiz/${created.body.data.id as string}/publish`)
      .send({ isPublished: true })
      .expect(200);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('plays a versus game to the end and updates statistics', async () => {
    const author = await users.register({
      telegramId: '900000001',
      firstName: 'Author',
      userName: null,
    });
    const rival = await users.register({
      telegramId: '900000002',
      firstName: 'Rival',
      userName: null,
    });

    const topics = await games.listTopics();
    expect(topics.map((topic) => topic.id)).toContain(tagId);

    const game = await games.create(author.id, tagId);
    await games.join(game.inviteToken, rival.id);

    const first = await games.getQuestion(game.id, author.id);
    expect(first?.question).toBe('1 + 1?');

    for (const userId of [author.id, rival.id]) {
      for (let index = 0; index < game.questionCount; index += 1) {
        const res = await games.submitAnswer(game.id, userId, index, 0);
        expect(res.accepted).toBe(true);
      }
    }

    const result = await games.getResult(game.id, author.id);
    expect(result.total).toBe(game.questionCount);
    expect(['win', 'lose', 'draw']).toContain(result.outcome);

    let statisticGame: {
      game_id: string;
      author_correct: boolean[];
      rival_correct: boolean[];
    } | null = null;
    for (let attempt = 0; attempt < 50 && !statisticGame; attempt += 1) {
      const rows = await dataSource.query<
        {
          game_id: string;
          author_correct: boolean[];
          rival_correct: boolean[];
        }[]
      >(
        'SELECT game_id, author_correct, rival_correct FROM statistic_games WHERE game_id = $1',
        [game.id],
      );
      statisticGame = rows[0] ?? null;
      if (!statisticGame) await delay(100);
    }

    expect(statisticGame).not.toBeNull();
    expect(statisticGame!.author_correct).toHaveLength(game.questionCount);
    expect(statisticGame!.rival_correct).toHaveLength(game.questionCount);

    const statisticUsers = await dataSource.query<
      { user_id: string; wins: number; losses: number; draws: number }[]
    >(
      `SELECT user_id, wins, losses, draws
       FROM statistic_users
       WHERE user_id IN ($1, $2)`,
      [author.id, rival.id],
    );

    expect(statisticUsers).toHaveLength(2);
    const totalResults = statisticUsers.reduce(
      (sum, row) => sum + Number(row.wins) + Number(row.losses) + Number(row.draws),
      0,
    );
    expect(totalResults).toBe(2);

    const authorStats = await stats.getStats(author.id);
    const rivalStats = await stats.getStats(rival.id);
    expect(
      authorStats.wins + authorStats.losses + authorStats.draws,
    ).toBe(1);
    expect(
      rivalStats.wins + rivalStats.losses + rivalStats.draws,
    ).toBe(1);
  });

  it('stores and consumes a pending invite token', async () => {
    const user = await users.register({
      telegramId: '900000003',
      firstName: 'Pending',
      userName: null,
    });

    await expect(
      users.setPendingInvite(user.telegramId, 'invite-token'),
    ).resolves.toBe(true);
    await expect(users.takePendingInvite(user.telegramId)).resolves.toBe(
      'invite-token',
    );
    await expect(users.takePendingInvite(user.telegramId)).resolves.toBeNull();
  });

  it('runs the query that finds expired or fully answered games', async () => {
    await expect(gameRepository.findFinishableActiveIds(10)).resolves.toEqual(
      [],
    );
  });
});

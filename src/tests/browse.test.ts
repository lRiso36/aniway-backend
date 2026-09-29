import request from 'supertest';
import app from '../app';
import AnimeModel from '../models/anime.model';

describe('GET /api/v1/browse/trending', () => {
  beforeEach(async () => {
    await AnimeModel.create([
      {
        anilistId: 1,
        titleRomaji: 'Trending High',
        displayTitle: 'Trending High',
        coverLarge: 'https://example.com/cover1.jpg',
        trending: 100,
      },
      {
        anilistId: 2,
        titleRomaji: 'Trending Low',
        displayTitle: 'Trending Low',
        coverLarge: 'https://example.com/cover2.jpg',
        trending: 10,
      },
      {
        anilistId: 3,
        titleRomaji: 'Not Trending',
        displayTitle: 'Not Trending',
        coverLarge: 'https://example.com/cover3.jpg',
        trending: 0,
      },
    ]);
  });

  test('returns trending anime sorted descending', async () => {
    const res = await request(app).get('/api/v1/browse/trending');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2); // excludes the 0-trending one
    expect(res.body[0].anilistId).toBe(1);
    expect(res.body[1].anilistId).toBe(2);
  });

  test('does not require authentication', async () => {
    const res = await request(app).get('/api/v1/browse/trending');
    expect(res.status).not.toBe(401);
  });

  test('respects the limit query param', async () => {
    const res = await request(app).get('/api/v1/browse/trending?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

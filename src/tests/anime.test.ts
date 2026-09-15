import request from 'supertest';
import app from '../app';
import AnimeModel from '../models/anime.model';

describe('GET /api/v1/anime', () => {
  beforeEach(async () => {
    await AnimeModel.create([
      {
        anilistId: 1,
        titleRomaji: 'Attack on Titan',
        displayTitle: 'Attack on Titan',
        coverLarge: 'http://example.com/1.jpg',
        genres: ['Action', 'Drama'],
        format: 'TV',
        status: 'FINISHED',
        seasonYear: 2013,
        season: 'SPRING',
        popularity: 100,
      },
      {
        anilistId: 2,
        titleRomaji: 'K-On!',
        displayTitle: 'K-On!',
        coverLarge: 'http://example.com/2.jpg',
        genres: ['Comedy', 'Slice of Life'],
        format: 'TV',
        status: 'FINISHED',
        seasonYear: 2009,
        season: 'SPRING',
        popularity: 50,
      },
      {
        anilistId: 3,
        titleRomaji: 'Frieren',
        displayTitle: "Frieren: Beyond Journey's End",
        coverLarge: 'http://example.com/3.jpg',
        genres: ['Action', 'Drama', 'Fantasy'],
        format: 'TV',
        status: 'RELEASING',
        seasonYear: 2023,
        season: 'FALL',
        popularity: 200,
      },
    ]);
  });

  test('returns all anime with default pagination when no params given', async () => {
    const res = await request(app).get('/api/v1/anime');

    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(3);
    expect(res.body.results).toHaveLength(3);
  });

  test('filters by genre', async () => {
    const res = await request(app).get('/api/v1/anime?genre=Comedy');

    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.results[0].displayTitle).toBe('K-On!');
  });

  test('filters by season and year together', async () => {
    const res = await request(app).get('/api/v1/anime?season=SPRING&year=2013');

    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.results[0].displayTitle).toBe('Attack on Titan');
  });

  test('respects limit and page for pagination', async () => {
    const res = await request(app).get('/api/v1/anime?limit=2&page=1');

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.totalPages).toBe(2);
  });

  test('rejects an invalid year', async () => {
    const res = await request(app).get('/api/v1/anime?year=1800');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/anime/:anilistId', () => {
  test('returns cached anime details without calling external APIs', async () => {
    await AnimeModel.create({
      anilistId: 999,
      titleRomaji: 'Cached Anime',
      displayTitle: 'Cached Anime',
      coverLarge: 'http://example.com/cached.jpg',
      detailsCached: true,
      description: 'A fully cached anime.',
    });

    const res = await request(app).get('/api/v1/anime/999');

    expect(res.status).toBe(200);
    expect(res.body.anilistId).toBe(999);
    expect(res.body.detailsCached).toBe(true);
    expect(res.body.description).toBe('A fully cached anime.');
  });
});

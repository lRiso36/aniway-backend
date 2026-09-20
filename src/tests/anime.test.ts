import request from 'supertest';
import app from '../app';
import AnimeModel from '../models/anime.model';
import UserModel from '../models/user.model';
import { signAccessToken } from '../utils/jwt.util';
import UserAnimeEntryModel from '../models/userAnimeEntry.model';

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

  // Small consistent-length fake embeddings — dimension doesn't matter for
  // cosine similarity correctness, only that all vectors compared are equal length.
  const embeddingA = [1, 0, 0, 0];
  const embeddingB = [0, 1, 0, 0];
  const embeddingC = [0.9, 0.1, 0, 0]; // similar to embeddingA

  describe('GET /api/v1/anime/recommended', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
      // ASSUMPTION: adjust to however your suite actually creates a test user + token
      const user = await UserModel.create({
        username: 'rectestuser',
        email: 'rectest@example.com',
        password: 'hashedpasswordplaceholder',
      });
      userId = user.id;
      token = signAccessToken(userId);
    });

    test('returns scored recommendations based on watched anime', async () => {
      const watched = await AnimeModel.create({
        anilistId: 10,
        titleRomaji: 'Watched Show',
        displayTitle: 'Watched Show',
        coverLarge: 'http://example.com/10.jpg',
        embedding: embeddingA,
      });

      await AnimeModel.create({
        anilistId: 11,
        titleRomaji: 'Similar Show',
        displayTitle: 'Similar Show',
        coverLarge: 'http://example.com/11.jpg',
        embedding: embeddingC,
      });

      await AnimeModel.create({
        anilistId: 12,
        titleRomaji: 'Dissimilar Show',
        displayTitle: 'Dissimilar Show',
        coverLarge: 'http://example.com/12.jpg',
        embedding: embeddingB,
      });

      await UserAnimeEntryModel.create({
        user: userId,
        anime: watched._id,
        status: 'completed',
      });

      const res = await request(app)
        .get('/api/v1/anime/recommended')
        .set('Cookie', [`accessToken=${token}`]); // ASSUMPTION: matches your cookie-based auth

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      // Watched anime should never be recommended back to the user
      expect(res.body.find((a: any) => a.anilistId === 10)).toBeUndefined();
      // Similar-embedding anime should rank above dissimilar
      const similarEntry = res.body.find((a: any) => a.anilistId === 11);
      const dissimilarEntry = res.body.find((a: any) => a.anilistId === 12);
      expect(similarEntry.score).toBeGreaterThan(dissimilarEntry.score);
    });

    test('falls back to popularity-sorted anime when user has no usable history', async () => {
      await AnimeModel.create([
        {
          anilistId: 20,
          titleRomaji: 'Low Pop',
          displayTitle: 'Low Pop',
          coverLarge: 'http://example.com/20.jpg',
          popularity: 10,
        },
        {
          anilistId: 21,
          titleRomaji: 'High Pop',
          displayTitle: 'High Pop',
          coverLarge: 'http://example.com/21.jpg',
          popularity: 500,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/anime/recommended')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body[0].anilistId).toBe(21);
      expect(res.body[0].score).toBeNull();
    });

    test('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/anime/recommended');
      expect(res.status).toBe(401);
    });

    test('rejects an invalid limit', async () => {
      const res = await request(app)
        .get('/api/v1/anime/recommended?limit=999')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(400);
    });
  });
});

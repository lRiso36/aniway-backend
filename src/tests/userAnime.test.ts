import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';

jest.mock('../utils/mailer.util', () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn().mockResolvedValue({ accepted: ['test@example.com'] }),
  },
}));

describe('User Anime routes', () => {
  const credentials = {
    username: 'animeloguser',
    email: 'animeloguser@example.com',
    password: 'Password123!',
  };
  const fakeAnimeId = new mongoose.Types.ObjectId().toString();

  async function getAuthHeader() {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(credentials);
    return `Bearer ${res.body.data.accessToken}`;
  }

  describe('PATCH /api/v1/user-anime/log', () => {
    test('creates a log entry when authenticated', async () => {
      const authHeader = await getAuthHeader();

      const res = await request(app)
        .patch('/api/v1/user-anime/log')
        .set('Authorization', authHeader)
        .send({ animeId: fakeAnimeId, status: 'watching', currentEpisode: 5 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('watching');
      expect(res.body.currentEpisode).toBe(5);
    });

    test('rejects when not authenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/user-anime/log')
        .send({ animeId: fakeAnimeId, status: 'watching' });

      expect(res.status).toBe(401);
    });

    test('rejects an invalid animeId', async () => {
      const authHeader = await getAuthHeader();

      const res = await request(app)
        .patch('/api/v1/user-anime/log')
        .set('Authorization', authHeader)
        .send({ animeId: 'not-a-real-id', status: 'watching' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/user-anime/toggle-favorite', () => {
    test('toggles favorite on then off', async () => {
      const authHeader = await getAuthHeader();

      const first = await request(app)
        .patch('/api/v1/user-anime/toggle-favorite')
        .set('Authorization', authHeader)
        .send({ animeId: fakeAnimeId });

      expect(first.status).toBe(200);
      expect(first.body.isFavorite).toBe(true);

      const second = await request(app)
        .patch('/api/v1/user-anime/toggle-favorite')
        .set('Authorization', authHeader)
        .send({ animeId: fakeAnimeId });

      expect(second.status).toBe(200);
      expect(second.body.isFavorite).toBe(false);
    });
  });

  describe('DELETE /api/v1/user-anime/:animeId', () => {
    test('removes an existing entry', async () => {
      const authHeader = await getAuthHeader();

      await request(app)
        .patch('/api/v1/user-anime/log')
        .set('Authorization', authHeader)
        .send({ animeId: fakeAnimeId, status: 'watching' });

      const res = await request(app)
        .delete(`/api/v1/user-anime/${fakeAnimeId}`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Entry removed');
    });

    test('returns not found when no entry exists', async () => {
      const authHeader = await getAuthHeader();

      const res = await request(app)
        .delete(`/api/v1/user-anime/${fakeAnimeId}`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
    });
  });
});

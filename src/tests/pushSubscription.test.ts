jest.mock('../utils/mailer.util', () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn().mockResolvedValue({ accepted: ['test@example.com'] }),
  },
}));

import request from 'supertest';
import app from '../app';

describe('POST /api/v1/push/subscribe', () => {
  const credentials = {
    username: 'pushuser',
    email: 'pushuser@example.com',
    password: 'Password123!',
  };

  async function getAuthHeader() {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(credentials);
    return `Bearer ${res.body.data.accessToken}`;
  }

  test('saves a subscription when authenticated', async () => {
    const authHeader = await getAuthHeader();

    const res = await request(app)
      .post('/api/v1/push/subscribe')
      .set('Authorization', authHeader)
      .send({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        keys: { p256dh: 'fake-p256dh-key', auth: 'fake-auth-key' },
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Subscription saved successfully');
  });

  test('rejects an invalid endpoint', async () => {
    const authHeader = await getAuthHeader();

    const res = await request(app)
      .post('/api/v1/push/subscribe')
      .set('Authorization', authHeader)
      .send({
        endpoint: 'not-a-url',
        keys: { p256dh: 'fake-p256dh-key', auth: 'fake-auth-key' },
      });

    expect(res.status).toBe(400);
  });

  test('rejects missing keys', async () => {
    const authHeader = await getAuthHeader();

    const res = await request(app)
      .post('/api/v1/push/subscribe')
      .set('Authorization', authHeader)
      .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc123' });

    expect(res.status).toBe(400);
  });

  test('rejects when not authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/push/subscribe')
      .send({
        endpoint: 'https://fcm.googleapis.com/fcm/send/xyz789',
        keys: { p256dh: 'fake-p256dh-key', auth: 'fake-auth-key' },
      });

    expect(res.status).toBe(401);
  });
});

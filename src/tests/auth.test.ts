import request from 'supertest';
import app from '../app';
import { signAccessToken, verifyAccessToken } from '../utils/jwt.util';

jest.mock('../utils/mailer.util', () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn().mockResolvedValue({ accepted: ['test@example.com'] }),
  },
}));

describe('POST /register', () => {
  test('creates a user and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  test('rejects invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      username: 'testuser2',
      email: 'not-an-email',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid email format');
  });

  test('rejects duplicate email', async () => {
    const payload = {
      username: 'testuser3',
      email: 'dupe@example.com',
      password: 'Password123!',
    };

    await request(app).post('/api/v1/auth/register').send(payload);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...payload, username: 'differentusername' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('An account with that email already exists');
  });

  test('rejects duplicate username', async () => {
    const payload = {
      username: 'dupeuser',
      email: 'unique1@example.com',
      password: 'Password123!',
    };

    await request(app).post('/api/v1/auth/register').send(payload);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...payload, email: 'unique2@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      'An account with that username already exists'
    );
  });
});

describe('POST /login', () => {
  const credentials = {
    username: 'loginuser',
    email: 'loginuser@example.com',
    password: 'Password123!',
  };

  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  test('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials.');
  });

  test('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials.');
  });
});

describe('POST /refresh', () => {
  const credentials = {
    username: 'refreshuser',
    email: 'refreshuser@example.com',
    password: 'Password123!',
  };

  test('refreshes tokens with a valid refresh token', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    const cookies = loginRes.headers['set-cookie']!;

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
  });

  test('rejects when no refresh token cookie is sent', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No refresh token provided');
  });

  test('rejects a garbage token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refreshToken=not.a.real.jwt');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized access.');
  });
});

describe('POST /verify-email', () => {
  test('verifies email with a valid token', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      username: 'verifyuser',
      email: 'verifyuser@example.com',
      password: 'Password123!',
    });

    const { userId } = verifyAccessToken(registerRes.body.data.accessToken);
    const token = signAccessToken(userId);

    const res = await request(app).get(`/api/v1/auth/verify-email/${token}`);

    expect(res.status).toBe(302);
  });

  test('rejects invalid token', async () => {
    const res = await request(app).get(
      '/api/v1/auth/verify-email/not-a-real-token'
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid or expired verification token');
  });
});

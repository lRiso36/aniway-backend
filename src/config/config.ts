import dotenv from 'dotenv';

dotenv.config();

interface IConfig {
  port: number;
  appMode: 'DEV' | 'PROD' | 'STAGING';
  databaseURL: string;
  tokenSecret: string;
  tokenTtl: string;
  refreshTokenSecret: string;
  refreshTokenTtl: string;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
}

const config: IConfig = {
  port: Number(process.env.PORT) || 5000,
  appMode: (process.env.APP_MODE as 'DEV' | 'PROD' | 'STAGING') || 'DEV',
  databaseURL:
    process.env[`${process.env.APP_MODE}_DATABASE_URL`] ||
    'mongodb://admin:password123@localhost:27017/aniway?authSource=admin',
  tokenSecret: process.env.TOKEN_SECRET || 'default_token_secret',
  tokenTtl: process.env.TOKEN_TTL || '1h',
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || 'default_refresh_token_secret',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:lenaderiso22@gmail.com',
};

export default config;

// PORT=5000
// DATABASE_URL=mongodb://admin:password123@localhost:27017/aniway?authSource=admin

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
  emailUser: string;
  emailAppPassword: string;
  emailVerificationTtl: string;
  clientUrl: string;
  passwordResetTtl: string;
  frontendUrl: string;
  googleClientId: string;
}

const config: IConfig = {
  port: Number(process.env.PORT) || 5000,
  appMode: (process.env.APP_MODE as 'DEV' | 'PROD' | 'STAGING') || 'DEV',
  databaseURL:
    process.env[`${process.env.APP_MODE}_DATABASE_URL`] ||
    'mongodb://admin:password123@127.0.0.1:27017/aniway?authSource=admin',
  tokenSecret: process.env.TOKEN_SECRET || 'default_token_secret',
  tokenTtl: process.env.TOKEN_TTL || '1h',
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || 'default_refresh_token_secret',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:lenaderiso22@gmail.com',
  emailUser: process.env.EMAIL_USER || '',
  emailAppPassword: process.env.EMAIL_APP_PASSWORD || '',
  emailVerificationTtl: process.env.EMAIL_VERIFICATION_TTL || '12h',
  clientUrl: 'http://localhost:5174',
  passwordResetTtl: process.env.PASSWORD_RESET_TTL || '1h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};

export default config;

// PORT=5000
// DATABASE_URL=mongodb://admin:password123@localhost:27017/aniway?authSource=admin

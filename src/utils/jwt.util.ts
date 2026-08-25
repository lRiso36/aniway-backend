import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import config from '../config/config';

export interface TokenPayload extends JwtPayload {
  userId: string;
}

export const signAccessToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: config.tokenTtl as StringValue,
  };
  return jwt.sign({ userId }, config.tokenSecret, options);
};

export const signRefreshToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: config.refreshTokenTtl as StringValue,
  };
  return jwt.sign({ userId }, config.refreshTokenSecret, options);
};

export const signTokens = (userId: string): {
  accessToken: string;
  refreshToken: string;
} => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  return { accessToken, refreshToken };
}

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.tokenSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.refreshTokenSecret) as TokenPayload;
};



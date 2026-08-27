import type { Request, Response, NextFunction } from 'express';

import * as jwtUtil from '../utils/jwt.util';
import errorHandler from '../utils/error-handler.util';
import ERROR_MESSAGES from '../constants/error-messages';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.accessToken ?? req.headers?.authorization?.split(' ')[1];

    const decoded = jwtUtil.verifyAccessToken(token);

    if (!decoded) throw new Error(ERROR_MESSAGES.EXPIRED_TOKEN);

    req.meta = {
      user: {
        _id: decoded.userId,
      },
    };

    next();
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
};

export default authMiddleware;

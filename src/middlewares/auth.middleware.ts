import type { Request, Response, NextFunction } from 'express';

import * as jwtUtil from '../utils/jwt.util';
import errorHandler from '../utils/error-handler.util';
import ERROR_MESSAGES from '../constants/error-messages';
import UserModel from '../models/user.model';

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.accessToken ?? req.headers?.authorization?.split(' ')[1];

    if (!token) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

    const decoded = jwtUtil.verifyAccessToken(token);

    if (!decoded) throw new Error(ERROR_MESSAGES.EXPIRED_TOKEN);

    const user = await UserModel.findById(decoded.userId).select('role');

    if (!user) throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

    req.meta = {
      user: {
        _id: user.id,
        role: user.role,
      },
    };

    next();
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
};

export default authMiddleware;

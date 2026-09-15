import type { Request, Response, NextFunction } from 'express';
import errorHandler from '../utils/error-handler.util';
import ERROR_MESSAGES from '../constants/error-messages';

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.meta?.user?.role;
    if (role !== 'admin') throw new Error(ERROR_MESSAGES.FORBIDDEN);
    next();
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
};

export default adminMiddleware;

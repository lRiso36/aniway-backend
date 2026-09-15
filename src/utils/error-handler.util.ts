import { Request, Response } from 'express';
import { ZodError } from 'zod';
import ERROR_MESSAGES from '../constants/error-messages';
import logger from '../logs/logger';

const errorHandler = (error: Error, req: Request, res: Response) => {
  logger.error('ERROR: ', error.toString());

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message;
    return res.status(400).json({ message });
  }

  switch (error.message) {
    case ERROR_MESSAGES.NOT_FOUND:
      return res.status(404).json({ message: ERROR_MESSAGES.NOT_FOUND });
    case ERROR_MESSAGES.EXPIRED_TOKEN:
      return res.status(401).json({ message: ERROR_MESSAGES.EXPIRED_TOKEN });
    case ERROR_MESSAGES.INVALID_CREDENTIALS:
      return res
        .status(401)
        .json({ message: ERROR_MESSAGES.INVALID_CREDENTIALS });
    case ERROR_MESSAGES.UNAUTHORIZED:
      return res.status(401).json({ message: ERROR_MESSAGES.UNAUTHORIZED });
    case ERROR_MESSAGES.BAD_REQUEST:
      return res.status(400).json({ message: ERROR_MESSAGES.BAD_REQUEST });
    case ERROR_MESSAGES.EMAIL_TAKEN:
      return res.status(409).json({ message: ERROR_MESSAGES.EMAIL_TAKEN });
    case ERROR_MESSAGES.USERNAME_TAKEN:
      return res.status(409).json({ message: ERROR_MESSAGES.USERNAME_TAKEN });
    case ERROR_MESSAGES.INVALID_TOKEN:
      return res.status(400).json({ message: ERROR_MESSAGES.INVALID_TOKEN });
    case ERROR_MESSAGES.SEARCH_FAILED:
      return res.status(500).json({ message: ERROR_MESSAGES.SEARCH_FAILED });
    default:
      return res.status(500).json({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export default errorHandler;

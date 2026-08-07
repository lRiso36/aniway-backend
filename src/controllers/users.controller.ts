import BaseController from './base.controller';
import UserModel, { User } from '../models/user.model';
import logger from '../logs/logger';
import { Request, Response } from 'express';
import path from 'path';
import { writeFile } from 'fs/promises';
class UsersController extends BaseController<User> {
  constructor() {
    super(UserModel);
  }

  async updateAvatar(req: Request, res: Response) {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          message: 'No file uploaded',
        });
      }

      // STAND IN UNTIL WE HAVE AUTH MIDDLEWARE
      const userId = req.body.userId;

      const extension = path.extname(file.originalname);
      const filename = `${userId}${extension}`;
      const uploadPath = path.join(__dirname, '..', 'uploads', filename);

      await writeFile(uploadPath, file.buffer);

      logger.info('user.controller.ts updateAvatar: req.file = ', req.file);

      res.status(200).json({
        message: 'File uploaded successfully',
        data: file,
      });
    } catch (error) {
      logger.error('Error saving avatar file:', error);
      res.status(500).json({
        message: error?.toString(),
      });
    }
  }
  method() {
    // this.logger.info("hello world")
    // this._.map([1, 2, 3], (n) => n * 2);
  }
}

const usersController = new UsersController();

export default usersController;

import BaseController from './base.controller';
import UserModel, { User } from '../models/user.model';
import logger from '../logs/logger';
import { Request, Response } from 'express';
import path from 'path';
import { writeFile } from 'fs/promises';
import UserAnimeEntryModel from '../models/userAnimeEntry.model';
import PushSubscriptionModel from '../models/pushSubscription.model';
import { UpdateUserSchema } from '../validators/users.validators';

// import { AvatarFileSchema } from '../validators/users.validators';
class UsersController extends BaseController<User> {
  constructor() {
    super(UserModel);
  }

  async updateAvatar(req: Request, res: Response) {
    try {
      const file = req.file;
      // const {file} = AvatarFileSchema.parse(req.file);

      if (!file) {
        return res.status(400).json({
          message: 'No file uploaded',
        });
      }

      const userId = req.meta!.user!._id;

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

  async me(req: Request, res: Response) {
    const userId = req.meta?.user?._id;
    console.log('userId =', userId);

    const user = await this.model
      .findById(userId)
      .select('_id email username displayName bio avatar');

    return res.status(200).json({
      message: 'user retrieved',
      data: { user, userId },
    });
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.meta!.user!._id;
      //TODO: POSSIBLY MORE? ASK ABOUT AUTH TOKEN ANDVERIFICATION TOKEN MODEL
      await Promise.all([
        UserAnimeEntryModel.deleteMany({
          user: userId,
        }),
        PushSubscriptionModel.deleteMany({
          userId,
        }),
      ]);
      await UserModel.findByIdAndDelete(userId);
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Account deleted' });
    } catch {
      res.status(500).json({ message: 'Failed to delete account' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const {
        id,
        username,
        email,
        displayName,
        bio,
        avatar,
        isPrivate,
        isVerified,
      } = UpdateUserSchema.parse(req.body);

      if (await UserModel.exists({ email, _id: { $ne: id } })) {
        throw new Error(this.ERROR_MESSAGES.EMAIL_TAKEN);
      }
      if (await UserModel.exists({ username, _id: { $ne: id } })) {
        throw new Error(this.ERROR_MESSAGES.USERNAME_TAKEN);
      }

      const user = await UserModel.findByIdAndUpdate(
        id,
        { username, email, displayName, bio, avatar, isPrivate, isVerified },
        { new: true, runValidators: true }
      ).lean();
      if (!user) {
        throw new Error(this.ERROR_MESSAGES.NOT_FOUND);
      }

      res.status(200).json({ user });
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }
}

const usersController = new UsersController();

export default usersController;

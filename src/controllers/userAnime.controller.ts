import { Request, Response } from 'express';

import BaseController from './base.controller';
import UserAnimeEntryModel, {
  UserAnimeEntry,
} from '../models/userAnimeEntry.model';
import {
  LogAnimeSchema,
  RemoveAnimeEntrySchema,
  ToggleFavoriteSchema,
} from '../validators/userAnime.validators';

class UserAnimeController extends BaseController<UserAnimeEntry> {
  constructor() {
    super(UserAnimeEntryModel);
  }

  async logAnime(req: Request, res: Response) {
    const {
      animeId,
      status,
      currentEpisode,
      repeatCount,
      score,
      startDate,
      finishDate,
      notes,
    } = LogAnimeSchema.parse(req.body);

    // STAND IN UNTIL WE HAVE AUTH MIDDLEWARE
    const userId = req.body.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    //END OF STAND IN

    try {
      const savedEntry = await UserAnimeEntryModel.findOneAndUpdate(
        { user: userId, anime: animeId },
        {
          $set: {
            status,
            currentEpisode,
            repeatCount,
            score,
            startDate,
            finishDate,
            notes,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json(savedEntry);
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  //rate and review

  // toggle is favorite
  async toggleIsFavorite(req: Request, res: Response) {
    const { animeId } = ToggleFavoriteSchema.parse(req.body);

    // STAND IN UNTIL WE HAVE AUTH MIDDLEWARE
    const userId = req.body.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    //END OF STAND IN

    try {
      const existing = await UserAnimeEntryModel.findOne({
        user: userId,
        anime: animeId,
      });

      const newFavoriteValue = !existing?.isFavorite;

      const entry = await UserAnimeEntryModel.findOneAndUpdate(
        { user: userId, anime: animeId },
        {
          $set: {
            isFavorite: newFavoriteValue,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json(entry);
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  //remove anime from entry
  async removeAnimeEntry(req: Request, res: Response) {
    const { animeId } = RemoveAnimeEntrySchema.parse(req.params);

    // STAND IN UNTIL WE HAVE AUTH MIDDLEWARE
    const userId = req.body.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    //END OF STAND IN

    try {
      const result = await UserAnimeEntryModel.deleteOne({
        user: userId,
        anime: animeId,
      });

      if (result.deletedCount === 0) {
        throw new Error(this.ERROR_MESSAGES.NOT_FOUND);
      }

      return res.status(200).json({ message: 'Entry removed' });
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }
}
const userAnimeController = new UserAnimeController();

export default userAnimeController;

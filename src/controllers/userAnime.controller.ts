import { Request, Response } from 'express';
import mongoose from 'mongoose';

import BaseController from './base.controller';
import UserAnimeEntryModel, {
  UserAnimeEntry,
} from '../models/userAnimeEntry.model';
import logger from '../logs/logger';

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
    } = req.body;
    // STAND IN UNTIL WE HAVE AUTH MIDDLEWARE
    const userId = req.body.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!animeId || !status) {
      return res
        .status(400)
        .json({ message: 'Anime Id and status are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(animeId)) {
      return res.status(400).json({ message: 'Invalid anime ID' });
    }

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
      logger.error('Error in log anime:', error);
      res.status(500).json({
        message: 'Something went wrong',
      });
    }
  }

  //rate and review

  // toggle is favorite
  async toggleIsFavorite(req: Request, res: Response) {
    const { animeId } = req.body;

    // STAND IN UNTIL WE HAVE AUTH MIDDLEWARE
    const userId = req.body.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!animeId) {
      return res.status(400).json({ message: 'Anime Id is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(animeId)) {
      return res.status(400).json({ message: 'Invalid anime ID' });
    }

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
      logger.error('Error in favorite anime:', error);
      res.status(500).json({
        message: 'Something went wrong',
      });
    }
  }

  //remove anime from entry
  async removeAnimeEntry(req: Request, res: Response) {
    const animeId = req.params.animeId as string;

    // STAND IN UNTIL WE HAVE AUTH MIDDLEWARE
    const userId = req.body.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!animeId) {
      return res.status(400).json({ message: 'Anime Id is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(animeId)) {
      return res.status(400).json({ message: 'Invalid anime ID' });
    }

    try {
      const result = await UserAnimeEntryModel.deleteOne({
        user: userId,
        anime: animeId,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Entry not found' });
      }

      return res.status(200).json({ message: 'Entry removed' });
    } catch (error) {
      logger.error('Error in remove anime:', error);
      res.status(500).json({
        message: 'Something went wrong',
      });
    }
  }
  //add review only

  //get status?
}
const userAnimeController = new UserAnimeController();

export default userAnimeController;

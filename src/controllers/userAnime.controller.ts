import { Request, Response } from 'express';

import BaseController from './base.controller';
import UserAnimeEntryModel, {
  UserAnimeEntry,
} from '../models/userAnimeEntry.model';
import logger from '../logs/logger';
import AnimeModel from '../models/anime.model';

class UserAnimeController extends BaseController<UserAnimeEntry> {
  constructor() {
    super(UserAnimeEntryModel);
  }

  async logAnime(req: Request, res: Response) {
    const {
      anilistId,
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

    if (!anilistId || !status) {
      return res
        .status(400)
        .json({ message: 'Anilist and status are required' });
    }

    const anime = await AnimeModel.findOne({ anilistId });

    if (!anime) {
      return res.status(404).json({ message: 'Anime not found' });
    }

    try {
      const savedEntry = await UserAnimeEntryModel.findOneAndUpdate(
        { user: userId, anime: anime._id },
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
        { upsert: true, new: true }
      );

      return res.status(200).json(savedEntry);
    } catch (error) {
      logger.error('Error in log anime:', error);
      res.status(500).json({
        message: 'Something went wrong',
      });
    }
  }
}
const userAnimeController = new UserAnimeController();

export default userAnimeController;

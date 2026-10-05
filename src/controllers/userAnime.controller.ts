import { Request, Response } from 'express';

import BaseController from './base.controller';
import UserAnimeEntryModel, {
  UserAnimeEntry,
} from '../models/userAnimeEntry.model';
import {
  GetUserAnimeSchema,
  LogAnimeSchema,
  RemoveAnimeEntrySchema,
  ToggleFavoriteSchema,
} from '../validators/userAnime.validators';
import type {
  UserAnimeEntryPopulated,
  UserAnimeEntryWithAnimePopulated,
} from '../types/entry.types';
import { mapEntry, mapEntryWithAnime } from '../utils/mapEntry.util';
import { ANIME_CARD_FIELDS } from '../types/anilist.types';

class UserAnimeController extends BaseController<UserAnimeEntry> {
  constructor() {
    super(UserAnimeEntryModel);
  }

  async getUserAnimeEntries(req: Request, res: Response) {
    try {
      const userId = req.meta?.user?._id;
      const { includeAnime } = GetUserAnimeSchema.parse(req.query);

      if (includeAnime) {
        const userAnime = (await UserAnimeEntryModel.find({ user: userId })
          .populate('anime', ANIME_CARD_FIELDS)
          .sort({ updatedAt: -1 })
          .lean()) as unknown as UserAnimeEntryWithAnimePopulated[];

        const entrieswithAnime = userAnime.map(mapEntryWithAnime);

        return res.status(200).json(entrieswithAnime);
      } else {
        const userAnime = (await UserAnimeEntryModel.find({ user: userId })
          .populate('anime', 'anilistId')
          .sort({ updatedAt: -1 })
          .lean()) as unknown as UserAnimeEntryPopulated[];

        const entries = userAnime.map(mapEntry);

        return res.status(200).json(entries);
      }
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  async logAnime(req: Request, res: Response) {
    try {
      const {
        animeId,
        status,
        currentEpisode,
        repeatCount,
        score,
        startDate,
        finishDate,
        notes,
        isFavorite,
      } = LogAnimeSchema.parse(req.body);

      const userId = req.meta?.user?._id;

      const savedEntry = (await UserAnimeEntryModel.findOneAndUpdate(
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
            isFavorite,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
        .populate('anime', 'anilistId')
        .lean()) as unknown as UserAnimeEntryPopulated;

      return res.status(200).json(mapEntry(savedEntry));
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  //rate and review

  // toggle is favorite
  async toggleIsFavorite(req: Request, res: Response) {
    try {
      const { animeId } = ToggleFavoriteSchema.parse(req.body);

      const userId = req.meta?.user?._id;

      const existing = await UserAnimeEntryModel.findOne({
        user: userId,
        anime: animeId,
      });

      const newFavoriteValue = !existing?.isFavorite;

      const entry = (await UserAnimeEntryModel.findOneAndUpdate(
        { user: userId, anime: animeId },
        {
          $set: { isFavorite: newFavoriteValue },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
        .populate('anime', 'anilistId')
        .lean()) as unknown as UserAnimeEntryPopulated;

      return res.status(200).json(mapEntry(entry));
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  //remove anime from entry
  async removeAnimeEntry(req: Request, res: Response) {
    try {
      const { animeId } = RemoveAnimeEntrySchema.parse(req.params);

      const userId = req.meta?.user?._id;

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

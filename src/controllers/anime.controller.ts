import { Request, Response } from 'express';

import BaseController from './base.controller';
import AnimeModel, { Anime } from '../models/anime.model';
import SearchCacheModel from '../models/search.model';
import logger from '../logs/logger';
import { searchAnimeHelper } from '../services/anime.service';

class AnimeController extends BaseController<Anime> {
  constructor() {
    super(AnimeModel);
  }

  async searchAnime(req: Request, res: Response) {
    try {
      const query = String(req.query.q).trim().toLowerCase();

      if (!query) {
        return res.status(400).json({ message: 'No query provided' });
      }

      //search database for search query and matching results
      const cached = await SearchCacheModel.findOne({ query }).populate(
        'animeIds'
      );

      if (cached) {
        return res.status(200).json(cached.animeIds);
      }

      //if not in database, search api
      const apiResults = await searchAnimeHelper(query);

      //if no results, skip extra stuff and just save + return
      if (apiResults.length === 0) {
        const emptyCache = await SearchCacheModel.create({
          query,
          animeIds: [],
        });

        return res.status(200).json({
          emptyCache,
        });
      }

      //upsert each anime by anilistId in one round trip
      //ordered = false means one bad doc wont block the rest of the batch
      const bulkMap = apiResults.map((anime) => ({
        updateOne: {
          filter: { anilistId: anime.anilistId },
          update: { $set: anime },
          upsert: true,
        },
      }));

      await AnimeModel.bulkWrite(bulkMap, { ordered: false });

      //fetch them back since bulkwrite doesnt return full docs
      const savedAnimes = await AnimeModel.find({
        anilistId: { $in: apiResults.map((a) => a.anilistId) },
      });

      //on bulk write failure
      if (savedAnimes.length === 0) {
        throw new Error(`Failed to save any anime for query "${query}`);
      }

      if (savedAnimes.length < apiResults.length) {
        const savedIds = new Set(savedAnimes.map((a) => a.anilistId));
        const failedIds = apiResults
          .filter((a) => !savedIds.has(a.anilistId))
          .map((a) => a.anilistId);

        logger.error('Failed to save some anime during search:', {
          query,
          failedIds,
        });
      }

      //map _ids for the cache record
      const animeIds = savedAnimes.map((anime) => anime._id);

      //create entry in cache table
      await SearchCacheModel.create({
        query,
        animeIds,
      });

      return res.status(200).json({
        savedAnimes,
      });
    } catch (error) {
      logger.error('Error in search anime:', error);
      res.status(500).json({
        message: 'Something went wrong',
      });
    }
  }
}

const animeController = new AnimeController();

export default animeController;

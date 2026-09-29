import { Request, Response } from 'express';

import AnimeModel, { Anime } from '../models/anime.model';
import { getTrendingAnimes } from '../services/trending.service';
import { getTrendingAnimeSchema } from '../validators/anime.validators';
import BaseController from './base.controller';

class BrowseController extends BaseController<Anime> {
  constructor() {
    super(AnimeModel);
  }

  async getTrendingAnime(req: Request, res: Response) {
    try {
      const { limit } = getTrendingAnimeSchema.parse(req.query);

      const trendingAnime = await getTrendingAnimes(limit);

      return res.status(200).json(trendingAnime);
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }
}

const browseController = new BrowseController();

export default browseController;

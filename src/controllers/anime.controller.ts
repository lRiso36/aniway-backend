import BaseController from './base.controller';
import AnimeModel, { Anime } from '../models/anime.model';

class AnimeController extends BaseController<Anime> {
  constructor() {
    super(AnimeModel);
  }
}

const animeController = new AnimeController();

export default animeController;

import { Router } from 'express';
import animeController from '../../../controllers/anime.controller';

const router = Router();

router.get('/search', animeController.searchAnime.bind(animeController));

export default router;

import { Router } from 'express';
import animeController from '../../../controllers/anime.controller';

const router = Router();

router.get('/', animeController.animeFilter.bind(animeController));
router.get(
  '/:anilistId',
  animeController.getAnimeDetails.bind(animeController)
);

export default router;

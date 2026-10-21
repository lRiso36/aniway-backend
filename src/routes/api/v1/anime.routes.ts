import { Router } from 'express';
import animeController from '../../../controllers/anime.controller';
import { authMiddleware } from '../../../middlewares';

const router = Router();

router.get('/', animeController.animeFilter.bind(animeController));
router.get(
  '/recommended',
  authMiddleware,
  animeController.getAnimeRecommendations.bind(animeController)
);
router.get(
  '/:anilistId',
  animeController.getAnimeDetails.bind(animeController)
);
router.get(
  '/:anilistId/episodes',
  animeController.getAnimeEpisodes.bind(animeController)
);
export default router;

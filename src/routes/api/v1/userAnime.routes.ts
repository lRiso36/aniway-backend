import { Router } from 'express';
import userAnimeController from '../../../controllers/userAnime.controller';

const router = Router();

router.patch('/log', userAnimeController.logAnime.bind(userAnimeController));
router.patch(
  '/toggle-favorite',
  userAnimeController.toggleIsFavorite.bind(userAnimeController)
);
router.delete(
  '/:animeId',
  userAnimeController.removeAnimeEntry.bind(userAnimeController)
);

export default router;

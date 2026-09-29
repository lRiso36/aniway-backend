import { Router } from 'express';
import browseController from '../../../controllers/browse.controller';

const router = Router();

router.get(
  '/trending',
  browseController.getTrendingAnime.bind(browseController)
);

export default router;

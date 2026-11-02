import { Router } from 'express';
import adminController from '../../../controllers/admin.controller';

const router = Router();

router.get('/anime', adminController.adminAnimeFilter);
router.patch('/anime/:anilistId/feature', adminController.featureAnime);

export default router;

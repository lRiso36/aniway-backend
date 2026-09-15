import { Router } from 'express';

import usersRoutes from './users.routes';
import pushSubscriptionRoutes from './pushSubscription.routes';
import authRoutes from './auth.routes';
import animeRoutes from './anime.routes';
import userAnimeRoutes from './userAnime.routes';
import { authMiddleware } from '../../../middlewares';

const router = Router();

router.use('/users', usersRoutes);
router.use('/push', authMiddleware, pushSubscriptionRoutes);
router.use('/auth', authRoutes);
router.use('/anime', animeRoutes);
router.use('/user-anime', authMiddleware, userAnimeRoutes);

export default router;

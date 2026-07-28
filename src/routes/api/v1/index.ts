import { Router } from 'express';

import usersRoutes from './users.routes';
import pushSubscriptionRoutes from './pushSubscription.routes';

const router = Router();

router.use('/users', usersRoutes);
router.use('/push', pushSubscriptionRoutes);

export default router;

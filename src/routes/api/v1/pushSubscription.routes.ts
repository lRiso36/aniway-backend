import { Router } from 'express';
import { saveSubscripton } from '../../../controllers/pushSubscription.controller';

const router = Router();

router.post('/subscribe', saveSubscripton);

export default router;

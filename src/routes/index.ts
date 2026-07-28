import { Router } from 'express';

import apiRoutes from './api';

const router = Router();

router.use('/api', apiRoutes);
// router.use("/upload", )
// router.use("/redirects")
// router.use("/static", )
router.use('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;

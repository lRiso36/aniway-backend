import { Router } from 'express';
import animeController from '../../../controllers/anime.controller';
import { authMiddleware } from '../../../middlewares';

const router = Router();
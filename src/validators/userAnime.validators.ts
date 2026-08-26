import mongoose from 'mongoose';
import * as z from 'zod';

const UserAnimeStatusEnum = z.enum([
  'watching',
  'rewatching',
  'completed',
  'planning',
  'paused',
  'dropped',
]);

const AnimeIdSchema = z
  .string()
  .min(1, 'Anime ID is required')
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Invalid anime ID',
  });

export const LogAnimeSchema = z.object({
  animeId: AnimeIdSchema,
  status: UserAnimeStatusEnum.default('planning'),
  currentEpisode: z.number().int().min(0).optional(),
  repeatCount: z.number().int().min(0).optional(),
  score: z.number().int().min(0).max(10).optional(),
  startDate: z.date().optional(),
  finishDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

export const ToggleFavoriteSchema = z.object({
  animeId: AnimeIdSchema,
});

export const RemoveAnimeEntrySchema = z.object({
  animeId: AnimeIdSchema,
});

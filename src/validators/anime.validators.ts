import * as z from 'zod';

export const SearchAnimeSchema = z.object({
  q: z.string().trim().toLowerCase().min(1, 'Search query is required'),
});

export const GetAnimeByIdSchema = z.object({
  anilistId: z.number('Anilist ID is required'),
});

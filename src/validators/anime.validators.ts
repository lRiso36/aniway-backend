import * as z from 'zod';

const genreEnum = z.enum([
  'Action',
  'Adventure',
  'Avant Garde',
  'Award Winning',
  'Comedy',
  'Drama',
  'Fantasy',
  'Gourmet',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Suspense',
]);

const seasonEnum = z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]);

const formatEnum = z.enum([
  "TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC",
]);

const statusEnum = z.enum([
  "FINISHED", "RELEASING", "NOT_YET_RELEASED", "CANCELLED", "HIATUS",
]);

const sortEnum = z.enum([
  "POPULARITY_DESC", "TRENDING_DESC", "SCORE_DESC",
  "FAVOURITES_DESC", "TITLE",
]);

export const SearchAnimeSchema = z.object({
  q: z.string().trim().toLowerCase().min(1, 'Search query is required'),
  genre: genreEnum.optional(),
  year: z.coerce.number().int().min(1940).max(new Date().getFullYear() + 1).optional(),
  season: seasonEnum.optional(),
  format: formatEnum.optional(),
  status: statusEnum.optional(),
  sort: sortEnum.optional().default("TITLE"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(24)
});

export const GetAnimeByIdSchema = z.object({
  anilistId: z.number('Anilist ID is required'),
});

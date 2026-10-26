import * as z from 'zod';
import { tagEnum } from './enums/tag.enum';

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

const seasonEnum = z.enum(['WINTER', 'SPRING', 'SUMMER', 'FALL']);

const formatEnum = z.enum([
  'TV',
  'TV_SHORT',
  'MOVIE',
  'SPECIAL',
  'OVA',
  'ONA',
  'MUSIC',
]);

const statusEnum = z.enum([
  'FINISHED',
  'RELEASING',
  'NOT_YET_RELEASED',
  'CANCELLED',
  'HIATUS',
]);

const sortEnum = z.enum([
  'POPULARITY_DESC',
  'TRENDING_DESC',
  'SCORE_DESC',
  'FAVOURITES_DESC',
  'TITLE',
]);

export const SearchAnimeSchema = z.object({
  q: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Search query is required')
    .optional(),
  genre: z
    .union([genreEnum, z.array(genreEnum)])
    .optional()
    .transform((val) =>
      val === undefined ? undefined : Array.isArray(val) ? val : [val]
    ),
  tag: z
    .union([tagEnum, z.array(tagEnum)])
    .optional()
    .transform((val) =>
      val === undefined ? undefined : Array.isArray(val) ? val : [val]
    ),
  year: z.coerce
    .number()
    .int()
    .min(1940)
    .max(new Date().getFullYear() + 1)
    .optional(),
  season: seasonEnum.optional(),
  format: formatEnum.optional(),
  status: statusEnum.optional(),
  sort: sortEnum.optional().default('TITLE'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(24),
});

export const GetAnimeByIdSchema = z.object({
  anilistId: z.coerce.number('Anilist ID is required'),
});

export const GetRecommendedAnimeSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const getTrendingAnimeSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const GetAnimeEpisodeSchema = z.object({
  anilistId: z.coerce.number('Anilist ID is required'),
})

const toArray = <T>(val: T | T[] | undefined) =>
  val === undefined ? undefined : Array.isArray(val) ? val : [val];

const adminSortEnum = z.enum([
  'trending',
  'popularity',
  'favourites',
  'averageScore',
  'seasonYear',
]);

export const AdminAnimeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  title: z.string().trim().min(1).optional(),
  format: z
    .union([formatEnum, z.array(formatEnum)])
    .optional()
    .transform(toArray),
  status: z
    .union([statusEnum, z.array(statusEnum)])
    .optional()
    .transform(toArray),
  genres: z
    .union([genreEnum, z.array(genreEnum)])
    .optional()
    .transform(toArray),
  seasonYear: z.coerce.number().int().optional(),
  isFeatured: z.enum(['true', 'false']).optional().transform((v) => v === undefined ? undefined : v === 'true'),
  isAdult: z.enum(['true', 'false']).optional().transform((v) => v === undefined ? undefined : v === 'true'),
  sortBy: adminSortEnum.optional().default('trending'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
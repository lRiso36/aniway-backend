import { Types } from 'mongoose';
import { Anime } from '../models/anime.model';
import { UserAnimeEntry } from '../models/userAnimeEntry.model';

export type AnimeForEmbedding = Pick<
  Anime,
  'titleRomaji' | 'description' | 'genres' | 'tags'
> & {
  _id: Types.ObjectId;
  studios: {
    studio: { anilistId: number; name: string };
    isAnimationStudio: boolean;
    isMain: boolean;
  }[];
};

type PopulatedAnimeEmbedding = {
  _id: Types.ObjectId;
  embedding: number[];
};

export type UserAnimeEntryWithEmbedding = Omit<UserAnimeEntry, 'anime'> & {
  anime: PopulatedAnimeEmbedding;
};

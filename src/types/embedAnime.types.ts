import { Types } from "mongoose";
import { Anime } from "../models/anime.model";

// export type AnimeWithPopulatedStudios = Omit<Anime, 'studios'> & {
//     studios: { studio: { anilistId: number; name: string }; isAnimationStudio: boolean; isMain: boolean }[];
// };

export type AnimeForEmbedding = Pick<Anime, 'titleRomaji' | 'description' | 'genres' | 'tags'> & {
  _id: Types.ObjectId; 
  studios: { studio: { anilistId: number; name: string }; isAnimationStudio: boolean; isMain: boolean }[];
};
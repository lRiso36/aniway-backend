import AnimeModel from '../models/anime.model';
import { ANIME_CARD_FIELDS, AnimeCardData } from '../types/anilist.types';

export async function getTrendingAnimes(
  limit: number = 20
): Promise<AnimeCardData[]> {
  const trendingAnime = await AnimeModel.find({ trending: { $gt: 0 } })
    .select(ANIME_CARD_FIELDS)
    .sort({ trending: -1 })
    .limit(limit)
    .lean();

  return trendingAnime.map((anime) => ({
    ...anime,
    _id: anime._id.toString(),
  }));
}

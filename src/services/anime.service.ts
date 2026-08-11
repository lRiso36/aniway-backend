import logger from '../logs/logger';
import { Anime } from '../models/anime.model';

const ANILIST_API_URL = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
    query ($search: String) {
        Page(perPage: 20) {
            media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
                id
                idMal
                title {
                    english
                    romaji
                }
                coverImage {
                    large
                    extraLarge
                }
                bannerImage
                startDate {
                    year
                }
                episodes
                averageScore
                genres
                description
            }
        }
    }
`;
interface AniListMediaResponse {
  id: number;
  idMal: number | null;
  title: {
    english: string | null;
    romaji: string;
  };
  coverImage: {
    large: string;
    extraLarge: string | null;
  };
  bannerImage: string | null;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  episodes: number | null;
  averageScore: number | null;
  genres: string[];
  description: string | null;
}

type AniListAnime = Omit<Anime, 'cachedAt' | 'detailsCached'>;

export const searchAnimeHelper = async (
  query: string
): Promise<AniListAnime[]> => {
  try {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { search: query },
      }),
    };

    const response = await fetch(ANILIST_API_URL, options);

    if (!response.ok) {
      logger.error(`Anilist API error:  ${response.status}`);
      throw new Error(`Anilist request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data?.data?.Page?.media) {
      throw new Error('Invalid Anilist response');
    }

    const results: AniListAnime[] = data.data.Page.media.map(
      (anime: AniListMediaResponse) => ({
        anilistId: anime.id,
        malId: anime.idMal ?? undefined,
        titleEnglish: anime.title.english ?? undefined,
        titleRomaji: anime.title.romaji,
        coverLarge: anime.coverImage.large,
        coverExtraLarge: anime.coverImage.extraLarge ?? undefined,
        bannerImage: anime.bannerImage ?? undefined,
        episodeCount: anime.episodes ?? undefined,
        averageScore: anime.averageScore ?? undefined,
        genres: anime.genres ?? [],
        description: anime.description ?? undefined,
        startDate: anime.startDate
          ? {
              year: anime.startDate.year ?? undefined,
              month: anime.startDate.month ?? undefined,
              day: anime.startDate.day ?? undefined,
            }
          : undefined,
      })
    );

    return results;
  } catch (error) {
    logger.error('Error in search anime helper:', error);
    throw error;
  }
};

import logger from '../logs/logger';
import type {
  AniListMediaResponse,
  AniListSearchResult,
  AniListMediaDetailResponse,
  AniListDetailResult,
  AniListCharacterResult,
  AniListStudioResult,
} from '../types/anilist.types';
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

const ANIME_DETAIL_QUERY = `
    query ($id: Int) {
    Media(id: $id, type: ANIME) {
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
        episodes
        averageScore
        genres
        description
        format
        status
        characters(sort: ROLE) {
            edges {
                role
                node {
                    id
                    name {
                        full
                    }
                    image {
                        large
                    }
                }
                voiceActors {
                    id
                    name {
                        full
                    }
                    language
                    image {
                        large
                    }
                }
            }
        }
        studios {
            nodes {
                id
                name
                isAnimationStudio
            }
        }
        source
        startDate {
            year
            month
            day
        }
        endDate {
            year
            month
            day
        }
        season
        seasonYear
        externalLinks {
            url
            site
            icon
            color
        }
    }
}
`;

export const searchAnimeHelper = async (
  query: string
): Promise<AniListSearchResult[]> => {
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

    const results: AniListSearchResult[] = data.data.Page.media.map(
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

export const getAnimeDetailsHelper = async (
  anilistId: number
): Promise<AniListDetailResult> => {
  try {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: ANIME_DETAIL_QUERY,
        variables: { id: anilistId },
      }),
    };

    const response = await fetch(ANILIST_API_URL, options);

    if (!response.ok) {
      logger.error(`Anilist API error:  ${response.status}`);
      throw new Error(`Anilist request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data?.data?.Media) {
      throw new Error('Invalid Anilist response');
    }

    const media: AniListMediaDetailResponse = data.data.Media;

    const characters: AniListCharacterResult[] = media.characters.edges.map(
      (edge) => ({
        anilistId: edge.node.id,
        name: edge.node.name.full,
        image: edge.node.image.large ?? undefined,
        role: edge.role,
        voiceActors: edge.voiceActors
          .filter(
            (actor) =>
              actor.language === 'JAPANESE' || actor.language === 'ENGLISH'
          )
          .map((actor) => ({
            anilistId: actor.id,
            name: actor.name.full,
            image: actor.image.large ?? undefined,
            language: actor.language as 'ENGLISH' | 'JAPANESE',
          })),
      })
    );

    const studios: AniListStudioResult[] = media.studios.nodes.map(
      (studio) => ({
        anilistId: studio.id,
        name: studio.name,
        isAnimationStudio: studio.isAnimationStudio,
      })
    );

    const result: AniListDetailResult = {
      anilistId: media.id,
      malId: media.idMal ?? undefined,
      titleEnglish: media.title.english ?? undefined,
      titleRomaji: media.title.romaji,
      coverLarge: media.coverImage.large,
      coverExtraLarge: media.coverImage.extraLarge ?? undefined,
      bannerImage: media.bannerImage ?? undefined,
      episodeCount: media.episodes ?? undefined,
      averageScore: media.averageScore ?? undefined,
      genres: media.genres ?? [],
      description: media.description ?? undefined,
      startDate: media.startDate
        ? {
            year: media.startDate.year ?? undefined,
            month: media.startDate.month ?? undefined,
            day: media.startDate.day ?? undefined,
          }
        : undefined,
      endDate: media.endDate
        ? {
            year: media.endDate.year ?? undefined,
            month: media.endDate.month ?? undefined,
            day: media.endDate.day ?? undefined,
          }
        : undefined,
      format: media.format ?? undefined,
      status: media.status ?? undefined,
      duration: media.duration ?? undefined,
      source: media.source ?? undefined,
      season: media.season ?? undefined,
      seasonYear: media.seasonYear ?? undefined,
      characters,
      studios,
      externalLinks: media.externalLinks.map((link) => ({
        url: link.url,
        site: link.site,
        icon: link.icon ?? undefined,
        color: link.color ?? undefined,
      })),
    };

    return result;
  } catch (error) {
    logger.error('Error in anime details helper:', error);
    throw error;
  }
};

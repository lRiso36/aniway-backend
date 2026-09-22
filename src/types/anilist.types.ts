//raw shapes Anilist's API returns

export interface AniListMediaResponse {
  id: number;
  idMal: number | null;
  title: {
    english: string | null;
    romaji: string;
  };
  coverImage: {
    large: string;
    extraLarge: string | null;
    color: string | null;
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
  popularity: number;
  favourites: number;
  isAdult: boolean;
  tags:
    | {
        name: string;
        rank: number;
        isMediaSpoiler: boolean;
      }[]
    | null;
  format: MediaFormat | null;
  status: MediaStatus | null;
  synonyms: string[];
}

type MediaFormat =
  'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
type MediaStatus =
  'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';

export interface AniListMediaDetailResponse extends AniListMediaResponse {
  duration: number | null;
  source: string | null;
  season: string | null;
  seasonYear: number | null;
  endDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  characters: {
    edges: {
      role: 'MAIN' | 'SUPPORTING' | 'BACKGROUND';
      node: {
        id: number;
        name: { full: string };
        image: { large: string };
      };
      voiceActors: {
        id: number;
        name: { full: string };
        language: string;
        image: { large: string };
      }[];
    }[];
  };
  studios: {
    edges: {
      isMain: boolean;
      node: {
        id: number;
        name: string;
        isAnimationStudio: boolean;
      };
    }[];
  };
  externalLinks: {
    url: string;
    site: string;
    icon: string | null;
    color: string | null;
  }[];
  trailer: {
    id: string;
    site: string;
    thumbnail: string | null;
  } | null;
}

//transformed shapes to match Mongo schema
export interface AniListSearchResult {
  anilistId: number;
  malId?: number;
  titleEnglish?: string;
  titleRomaji: string;
  displayTitle: string;
  coverLarge: string;
  coverExtraLarge?: string;
  coverColor?: string;
  bannerImage?: string;
  episodeCount?: number;
  averageScore?: number;
  genres: string[];
  description?: string;
  startDate?: { year?: number; month?: number; day?: number };
  popularity: number;
  favourites: number;
  isAdult: boolean;
  tags?: AniListTagResult[];
  synonyms: string[];
}

export type AnimeCardData = {
  _id: string;
  anilistId: number;
  malId?: number;
  titleEnglish?: string;
  titleRomaji: string;
  displayTitle?: string;
  coverLarge: string;
  coverExtraLarge?: string;
  coverColor?: string;
  bannerImage?: string;
  episodeCount?: number;
  averageScore?: number;
  genres: string[];
  description?: string;
  startDate?: { year?: number; month?: number; day?: number };
};

export interface AniListTagResult {
  name: string;
  rank: number;
  isSpoiler: boolean;
}

export interface AniListVoiceActorResult {
  anilistId: number;
  name: string;
  image?: string;
  language: 'ENGLISH' | 'JAPANESE';
}

export interface AniListCharacterResult {
  anilistId: number;
  name: string;
  image?: string;
  role: 'MAIN' | 'SUPPORTING' | 'BACKGROUND';
  voiceActors: AniListVoiceActorResult[];
}

export interface AniListStudioResult {
  anilistId: number;
  name: string;
  isAnimationStudio: boolean;
  isMain: boolean;
}

export interface AniListExternalLinkResult {
  url: string;
  site: string;
  icon?: string;
  color?: string;
}

export interface AniListTrailerResult {
  id: string;
  site: string;
  thumbnail?: string;
}

export interface AniListDetailResult extends AniListSearchResult {
  format?: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
  status?:
    'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  duration?: number;
  source?: string;
  season?: string;
  seasonYear?: number;
  endDate?: { year?: number; month?: number; day?: number };
  characters: AniListCharacterResult[];
  studios: AniListStudioResult[];
  externalLinks: AniListExternalLinkResult[];
  trailer?: AniListTrailerResult;
}

export const ANIME_CARD_FIELDS =
  '_id anilistId malId titleEnglish titleRomaji displayTitle coverLarge coverExtraLarge bannerImage episodeCount averageScore genres description detailsCached startDate coverColor';
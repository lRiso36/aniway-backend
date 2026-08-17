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

type MediaFormat =
  'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
type MediaStatus =
  'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';

export interface AniListMediaDetailResponse extends AniListMediaResponse {
  format: MediaFormat | null;
  status: MediaStatus | null;
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
    nodes: {
      id: number;
      name: string;
      isAnimationStudio: boolean;
    }[];
  };
  externalLinks: {
    url: string;
    site: string;
    icon: string | null;
    color: string | null;
  }[];
}

//transformed shapes to match Mongo schema
export interface AniListSearchResult {
  anilistId: number;
  malId?: number;
  titleEnglish?: string;
  titleRomaji: string;
  coverLarge: string;
  coverExtraLarge?: string;
  bannerImage?: string;
  episodeCount?: number;
  averageScore?: number;
  genres: string[];
  description?: string;
  startDate?: { year?: number; month?: number; day?: number };
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
}

export interface AniListExternalLinkResult {
  url: string;
  site: string;
  icon?: string;
  color?: string;
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
}

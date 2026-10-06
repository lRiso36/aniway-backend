export interface KitsuEpisodeAttributes {
  number: number | null;
  relativeNumber: number | null;
  canonicalTitle: string | null;
  titles?: { ja_jp?: string | null };
  airdate: string | null;
}

export interface EpisodeDataType {
  episodeNumber: number;
  relativeNumber?: number;
  title?: string;
  titleJapanese?: string;
  airedAt?: Date;
  filler?: boolean;
  recap?: boolean;
}

export interface UpdateEpisodeType {
  anilistId: number;
  malId?: number;
  episodeCount?: number;
}

export interface writeEpisodeData {
  anilistId: number;
  episodes: [EpisodeDataType];
}

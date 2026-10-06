export interface KitsuEpisodeAttributes {
  number: number | null;
  relativeNumber: number | null;
  seasonNumber: number | null;
  canonicalTitle: string | null;
  titles?: { ja_jp?: string | null };
  airdate: string | null;
}

export interface EpisodeDataType {
  episodeNumber: number;
  title: string | null;
  titleJapanese: string | null;
  airedAt: Date | null;
  relativeNumber: number | null;
  seasonNumber: number | null;
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

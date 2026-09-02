export interface JikanEpisodeResult {
    mal_id: number;
    title: string;
    title_japanese: string | null;
    aired: string | null;
    filler: boolean;
    recap: boolean;
}

export interface EpisodeDataType {
    episodeNumber: number;
    title: string;
    titleJapanese: string | null;
    airedAt: Date | null;
    filler: boolean;
    recap: boolean;
}

export interface UpdateEpisodeType {
    anilistId: number;
    malId?: number;
    episodeCount?: number;
}

export interface writeEpisodeData {
    anilistId: number;
    episodes: [EpisodeDataType]
}

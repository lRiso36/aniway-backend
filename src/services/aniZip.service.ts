import { Episode } from "../models/anime.model";

export class AniZipError extends Error { }

type AniZipEpisode = {
    runtime?: number;
    airDateUtc?: string;
    title?: { en?: string; ja?: string; 'x-jat'?: string };
};

export async function fetchAniZipEpisodes(anilistId: number) {
    const res = await fetch(`https://api.ani.zip/mappings?anilist_id=${anilistId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new AniZipError(`ani.zip responded ${res.status}`);

    const data = (await res.json()) as {
        episodes?: Record<string, AniZipEpisode>;
    };
    return data.episodes ?? {};
}

export function mergeAniZipEpisodes(
    existing: Episode[],
    incoming: Record<string, AniZipEpisode>
): Episode[] {
    return existing.map((ep) => {
        const src = incoming[String(ep.episodeNumber)];
        if (!src) return ep;

        return {
            ...ep,
            title: ep.title || src.title?.en || undefined,
            titleRomaji: ep.titleRomaji || src.title?.['x-jat'] || undefined,
            titleJapanese: ep.titleJapanese || src.title?.ja || undefined,
            runtime: src.runtime ?? ep.runtime,
        };
    });
}
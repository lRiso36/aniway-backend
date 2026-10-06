import { EpisodeDataType, KitsuEpisodeAttributes } from "../types/episodeData.types";

const KITSU_BASE_URL = 'https://kitsu.io/api/edge';
const REQUEST_TIMEOUT_MS = 10_000;

export class KitsuInfrastructureError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = 'KitsuInfrastructureError';
    }
}

async function kitsuGet(url: string): Promise<any> {
    let res: Response;
    try {
        res = await fetch(url, {
            headers: {
                Accept: 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
    } catch (err) {
        throw new KitsuInfrastructureError(`Kitsu request failed: ${url}`, err);
    }
    if (!res.ok) {
        throw new KitsuInfrastructureError(`Kitsu responded ${res.status}: ${url}`);
    }
    return res.json();
}

export async function findKitsuId(anilistId: number): Promise<string | null> {
    const url = `${KITSU_BASE_URL}/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${anilistId}&include=item`;
    const body = await kitsuGet(url);
    return body.data?.[0]?.relationships?.item?.data?.id ?? null;
}

const PAGE_LIMIT = 20;
const REQUEST_DELAY_MS = 250;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchKitsuEpisodes(kitsuId: string): Promise<EpisodeDataType[]> {
    const episodes: EpisodeDataType[] = [];
    let url: string | null =
        `${KITSU_BASE_URL}/anime/${kitsuId}/episodes?page[limit]=${PAGE_LIMIT}&page[offset]=0`;

    while (url) {
        const body = await kitsuGet(url);

        for (const item of body.data ?? []) {
            const a: KitsuEpisodeAttributes = item.attributes;
            if (a.number == null) continue;

            episodes.push({
                episodeNumber: a.number,
                title: a.canonicalTitle ?? null,
                titleJapanese: a.titles?.ja_jp ?? null,
                airedAt: a.airdate ? new Date(a.airdate) : null,
                relativeNumber: a.relativeNumber ?? null,
                seasonNumber: a.seasonNumber ?? null,
            });
        }

        url = body.links?.next ?? null;
        if (url) await sleep(REQUEST_DELAY_MS);
    }

    return episodes;
}
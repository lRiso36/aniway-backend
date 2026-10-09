import { HydratedDocument } from 'mongoose';
import {
  EpisodeDataType,
  KitsuEpisodeAttributes,
} from '../types/episodeData.types';
import { Anime } from '../models/anime.model';

const KITSU_BASE_URL = 'https://kitsu.io/api/edge';
const REQUEST_TIMEOUT_MS = 10_000;

export class KitsuInfrastructureError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'KitsuInfrastructureError';
  }
}

export class KitsuNotFoundError extends Error {
  constructor(url: string) {
    super(`Kitsu record not found: ${url}`);
    this.name = 'KitsuNotFoundError';
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
  if (res.status === 404) throw new KitsuNotFoundError(url);

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

export async function fetchKitsuEpisodes(
  kitsuId: string,
  startOffset = 0
): Promise<EpisodeDataType[]> {
  const episodes: EpisodeDataType[] = [];
  let url: string | null =
    `${KITSU_BASE_URL}/anime/${kitsuId}/episodes?page[limit]=${PAGE_LIMIT}&page[offset]=${startOffset}`;

  while (url) {
    const body = await kitsuGet(url);

    for (const item of body.data ?? []) {
      const a: KitsuEpisodeAttributes = item.attributes;
      if (a.number == null) continue;

      episodes.push({
        episodeNumber: a.number,
        relativeNumber: a.relativeNumber ?? undefined,
        title: a.canonicalTitle ?? undefined,
        titleJapanese: a.titles?.ja_jp ?? undefined,
        airedAt: a.airdate ? new Date(a.airdate) : undefined,
      });
    }

    url = body.links?.next ?? null;
    if (url) await sleep(REQUEST_DELAY_MS);
  }

  return episodes;
}

export async function processAnime(
  anime: HydratedDocument<Anime>
): Promise<'done' | 'skipped' | 'not-found'> {
  let kitsuId = anime.kitsuId;

  if (!kitsuId) {
    const found = await findKitsuId(anime.anilistId);
    if (!found) return 'skipped'; // no Kitsu mapping, episodesCached stays false
    kitsuId = found;
    anime.kitsuId = found;
  }

  let episodes: EpisodeDataType[];
  try {
    episodes = await fetchKitsuEpisodes(kitsuId);
  } catch (err) {
    if (err instanceof KitsuNotFoundError) return 'not-found';
    throw err;
  }
  anime.episodes = episodes.map((e) => ({ ...e, cachedAt: new Date() }));
  anime.episodesCached = true;
  await anime.save();
  return 'done';
}

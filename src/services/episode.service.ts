import logger from "../logs/logger";
import { JikanEpisodeResult } from "../types/episodeData.types";


const JIKAN_BASE = 'https://api.jikan.moe/v4/anime'
const WAIT_MS = 1200
const MAX_RETRIES = 3;
const REQUEST_DELAY_MS = 350;

export class JikanInfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JikanInfrastructureError';
  }
}

async function fetchPageWithRetry(malId: number, pageNumber: number, retries = MAX_RETRIES): Promise<any> {
    const response = await fetch(`${JIKAN_BASE}/${malId}/episodes?page=${pageNumber}`);

    console.log([...response.headers.entries()]);
    
    if (response.status === 429 || response.status >= 500) {
        if (retries <= 0) {
            throw new JikanInfrastructureError(`Rate limited or server error on anime with id ${malId} out of retries`);
        }

        logger.error(`Got ${response.status} on id ${malId} (page ${pageNumber}), waiting ${WAIT_MS}ms`);
        await new Promise((resolve) => setTimeout(resolve, WAIT_MS));

        return fetchPageWithRetry(malId, pageNumber, retries - 1);
    }

    if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`Jikan API error: ${response.status} - ${errorBody}`);
        throw new Error(`Jikan request failed with status ${response.status}`);
    }

    return response.json();
}

export async function fetchEpisodesForOneAnime(malId: number): Promise<JikanEpisodeResult[]> {
    const episodes: JikanEpisodeResult[] = [];
    let pageNumber = 1;
    let hasNext = true;

    while (hasNext) {
        const data = await fetchPageWithRetry(malId, pageNumber);
        episodes.push(...data.data);

        if (data?.pagination?.has_next_page) {
            pageNumber++;
            await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
        } else {
            hasNext = false;
        }
    }

    return episodes;
}


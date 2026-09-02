import { ANIME_DETAIL_QUERY } from "../queries/fullAnimeQuery";
import logger from "../logs/logger";
const ANILIST_API_URL = 'https://graphql.anilist.co';

//takes page/perPage, calls Anilist's endpoint and returns parsed response
//429 retry/backoff handler included
export async function fetchAnimeByIds(ids: number[], retries = 3): Promise<any> {

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: ANIME_DETAIL_QUERY,
            variables: { ids },
        }),
    };

    const response = await fetch(ANILIST_API_URL, options);

    if (response.status === 429) {
        if (retries <= 0) {
            throw new Error(`Rate limited on id ${ids[0]}, out of retries`);
        }

        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? Number(retryAfter) * 1000 : 5000;
        logger.error(`Rate limited on id ${ids[0]}, waiting ${waitMs}ms`);

        //set timeout 
        await new Promise((resolve) => setTimeout(resolve, waitMs));

        return fetchAnimeByIds(ids, retries - 1);
    }
    if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`Anilist API error: ${response.status} - ${errorBody}`);
        throw new Error(`Anilist request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.data.Page;
}
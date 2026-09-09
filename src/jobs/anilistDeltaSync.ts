import logger from "../logs/logger";
import { SyncState } from "../models/syncState.model";
import { ANIME_DELTA_QUERY } from "../queries/updateAnimeQuery";
import { processBatch } from "../scripts/animeSeed/seedAnimeLoad";
import { formatAnimeDetails } from "../services/anime.service";
import { fetchAniList } from "../services/fetchAnimePage";
import { AniListDetailResult, AniListMediaDetailResponse } from "../types/anilist.types";

export async function anilistDeltaSync() {
    const syncState = await SyncState.findOneAndUpdate(
        { key: 'anilist-sync' },
        { $setOnInster: { lastSyncedAt: null } },
        { upsert: true, new: true }
    );

    const lastSyncedAt = syncState.lastSyncedAt;
    
    const changedAnime: AniListMediaDetailResponse[] = []; // raw AniList anime objects, collected as we go
    const changedAnimeIds: number[] = [];
    let maxUpdatedAt: Date | null = null;

    let page = 1;
    let keepGoing = true;

    while (keepGoing) {
        const result = await fetchAniList(ANIME_DELTA_QUERY, { page, perPage: 50 });
        const mediaList = result.media;

        for (const anime of mediaList) {
            const updatedAt = new Date(anime.updatedAt * 1000); //anilist returns seconds

            if (lastSyncedAt && updatedAt <= lastSyncedAt) {
                keepGoing = false;
                break; //stop processing, everything after is old
            }

            const { updatedAt: _updatedAt, ...animeWithoutUpdatedAt } = anime;
            changedAnime.push(animeWithoutUpdatedAt);
            changedAnimeIds.push(anime.id);
            

            if (!maxUpdatedAt || updatedAt > maxUpdatedAt) {
                maxUpdatedAt = updatedAt;
            }
        }
        if (mediaList.length === 0) keepGoing = false; //no more pages

        page++;
    }

    if (changedAnime.length > 0) {
        const formatted: AniListDetailResult[] = changedAnime.map(formatAnimeDetails);
        await processBatch(formatted);
    }

    //change new sync state
    if (maxUpdatedAt) {
        await SyncState.updateOne({ key: 'anilist-sync' }, { lastSyncedAt: maxUpdatedAt });
    }

    logger.info(`Complete anilistDeltaSync updated ${changedAnimeIds.length} anime`)
    return changedAnimeIds;

}
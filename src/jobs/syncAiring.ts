import logger from "../logs/logger";
import AiringModel from "../models/airing.model";
import AnimeModel from "../models/anime.model";
import { AIRING_QUERY } from "../queries/airingAnimeQuery";
import { fetchAniList } from "../services/fetchAnimePage";
import { AiringScheduleNode } from "../types/anilist.types";


export async function syncAiring() {
    const now = new Date();

    //get sunday of this week
    const from = new Date(now);
    from.setUTCDate(now.getUTCDate() - now.getUTCDay());
    from.setUTCHours(0, 0, 0, 0);

    const to = new Date(from);
    to.setUTCDate(from.getUTCDate() + 28);

    const fromUnix = Math.floor(from.getTime() / 1000) - 1;
    const toUnix = Math.floor(to.getTime() / 1000)

    const airingAnime = await fetchAiringWindow(fromUnix, toUnix);

    logger.info(`Fetched ${airingAnime.length} airing entries from AniList`);

    await processAiringAnime(airingAnime);
}


async function fetchAiringWindow(from: number, to: number, perPage = 50) {
    const airingAnime: AiringScheduleNode[] = []

    let page = 1
    let hasNextPage = true;

    while (hasNextPage) {
        const data = await fetchAniList(AIRING_QUERY, { page, perPage, from, to });
        const { pageInfo, airingSchedules } = data.Page;

        airingAnime.push(...airingSchedules);

        if (pageInfo.hasNextPage) {
            page++;
        } else {
            hasNextPage = false;
        }
    }

    return airingAnime;
}

async function processAiringAnime(animeList: AiringScheduleNode[]) {
    const airingIds = [...new Set(animeList.map((anime) => anime.mediaId))];
    const airingAnime = await AnimeModel.find(
        { anilistId: { $in: airingIds } }
    ).select('_id anilistId')
        .lean()

    const airingMap = new Map(airingAnime.map((anime) => [anime.anilistId, anime._id]));

    //skip shows with no matching anime model
    const matched = animeList.filter((entry) => airingMap.has(entry.mediaId));

    const airingBulkMap = matched.map((anime) => ({
        updateOne: {
            filter: { scheduleId: anime.id },
            update: {
                $set: {
                    scheduleId: anime.id,
                    anilistId: anime.mediaId,
                    anime: airingMap.get(anime.mediaId),
                    episode: anime.episode,
                    airingAt: new Date(anime.airingAt * 1000),
                    isAdult: anime.media?.isAdult ?? false
                }
            },
            upsert: true
        }
    }));

    if (airingBulkMap.length === 0) {
        logger.info("Wrote 0 animes for airing job")
        return
    };

    const airingBulkResult = await AiringModel.bulkWrite(
        airingBulkMap,
        { ordered: false }
    )

    if (airingBulkResult.hasWriteErrors()) {
        logger.error(
            `Airing bulkWrite had ${airingBulkResult.getWriteErrorCount()} failures:`,
            airingBulkResult.getWriteErrors()
        );
    }

    logger.info(`Saved ${airingBulkResult.upsertedCount} airing anime`)
}
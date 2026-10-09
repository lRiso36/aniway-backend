import logger from "../logs/logger";
import AnimeModel from "../models/anime.model";
import { fetchKitsuEpisodes, KitsuInfrastructureError, KitsuNotFoundError } from "../services/kitsu.service";
import { EpisodeDataType } from "../types/episodeData.types";

export async function fetchNewEpisodes() {
    let done = 0;
    let skipped = 0;
    let notFound = 0;
    let failed = 0;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5;
    const now = new Date();
    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

    const monthPairs = [
        { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 },
        { year: prev.getUTCFullYear(), month: prev.getUTCMonth() + 1 },
    ];

    try {
        const candidates = await AnimeModel.find({
            kitsuId: { $ne: null },
            $or: [
                { status: 'RELEASING' },
                ...monthPairs.map((pair) => ({
                    'endDate.year': pair.year,
                    'endDate.month': pair.month
                }))
            ]
        })
        if (candidates.length === 0) {
            logger.info('No releasing anime found');
            return;
        }


        for (let anime of candidates) {
            await new Promise((r) => setTimeout(r, 250));
            if (!anime.kitsuId) {
                skipped += 1;
                continue;
            }
            let episodes: EpisodeDataType[];
            try {
                episodes = await fetchKitsuEpisodes(anime.kitsuId, anime.episodes?.length);
                consecutiveErrors = 0;
            } catch (error) {
                if (error instanceof KitsuNotFoundError) {
                    consecutiveErrors = 0;
                    notFound += 1;
                    continue;
                }
                if (error instanceof KitsuInfrastructureError) {
                    failed += 1;
                    consecutiveErrors += 1;
                    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) throw error;
                    continue;
                }
                throw error;
            }
            const episodeMap = new Map();
            for (const e of anime.episodes ?? []) episodeMap.set(e.episodeNumber, e);
            for (const e of episodes) episodeMap.set(e.episodeNumber, { ...e, cachedAt: new Date() });

            anime.episodes = [...episodeMap.values()].sort((a, b) => a.episodeNumber - b.episodeNumber);

            await anime.save();
            done += 1;
        }

    } finally {
        logger.info(`New episodes job: ${done} updated, ${skipped} skipped, ${notFound} not found, ${failed} failed`);
    }

}
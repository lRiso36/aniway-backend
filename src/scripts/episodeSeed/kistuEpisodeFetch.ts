import connectDB from '../../config/db';
import logger from '../../logs/logger';
import AnimeModel from '../../models/anime.model';
import { KitsuInfrastructureError } from '../../services/kitsu.service';
import { processAnime } from '../../services/kitsu.service';

const MAX_CONSECUTIVE_FAILURES = 5;

export async function backfillEpisodes() {
    let done = 0;
    let skipped = 0;
    let infraFailures = 0;
    let consecutive = 0;
    const otherFailures: number[] = [];

    const cursor = AnimeModel.find({ episodesCached: false }).cursor();
    // const cursor = AnimeModel.find({ anilistId: 16498 }).cursor();

    for await (const anime of cursor) {
        try {
            const result = await processAnime(anime);
            const note =
                result === 'done'
                    ? `(${anime.episodes?.length ?? 0} episodes, kitsuId ${anime.kitsuId})`
                    : result === 'not-found'
                        ? '(Kitsu record not found)'
                        : '(no Kitsu mapping)';
            logger.info(`[${done + skipped + 1}] ${anime.anilistId} ${result} ${note}`);
            if (result === 'done') done += 1;
            else skipped += 1;
            consecutive = 0;
            if ((done + skipped) % 100 === 0) {
                logger.info(`Progress: ${done} done, ${skipped} skipped, ${infraFailures} infra failures`);
            }
        } catch (err) {
            if (err instanceof KitsuInfrastructureError) {
                infraFailures += 1;
                consecutive += 1;
                logger.error(`Kitsu failure on ${anime.anilistId}: ${err.message}`);
                if (consecutive >= MAX_CONSECUTIVE_FAILURES) {
                    logger.error(`Stopping: ${consecutive} infrastructure failures in a row`);
                    break;
                }
            } else {
                otherFailures.push(anime.anilistId);
                const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
                logger.error(`Failed on ${anime.anilistId}: ${msg}`);
            }
        }
    }

    logger.info(
        `Episode backfill finished: ${done} done, ${skipped} skipped, ${infraFailures} infra failures, ${otherFailures.length} other failures`
    );
}

connectDB()
    .then(() => backfillEpisodes())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Load script failed:', err);
        process.exit(1);
    })
import cron from 'node-cron';
import { anilistDeltaSync } from './anilistDeltaSync';
import logger from '../logs/logger';
import { syncTrending } from './syncTrending';
import { syncAiring } from './syncAiring';
import { fetchNewEpisodes } from './fetchNewEpisodes';

export function startScheduledJobs() {
  cron.schedule('30 20 * * *', async () => {
    logger.info('Starting AniList delta sync');
    try {
      const changedIds = await anilistDeltaSync();
      logger.info(
        `AniList delta sync complete. ${changedIds.length} anime changed.`
      );
    } catch (err) {
      logger.error(`AniList delta sync failed: ${err}`);
    }
  });

  cron.schedule('* 21 * * *', async () => {
    logger.info('Starting Kitsu new episode sync');
    try {
      await fetchNewEpisodes();
      logger.info('Kitsu new episode sync complete.');
    } catch (err) {
      logger.error(`Kitsu new episode sync failed: ${err}`);
    }
  });

  cron.schedule('5 20 * * *', async () => {
    logger.info('Starting trending anime sync');
    try {
      await syncTrending();
      logger.info('Trending anime sync complete');
    } catch (err) {
      logger.error(`Anime trending sync failed: ${err}`);
    }
  });
  cron.schedule('40 20 * * *', async () => {
    logger.info('Starting airing anime sync');
    try {
      await syncAiring();
      logger.info('Airing anime sync completed');
    } catch (err) {
      logger.error(`Anime airing sync failed: ${err}`);
    }
  });
}

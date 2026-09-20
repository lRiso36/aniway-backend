import cron from 'node-cron';
import { anilistDeltaSync } from './anilistDeltaSync';
import { jikanEpisodeRetry } from './jikanEpisodeRetry';
import logger from '../logs/logger';

export function startScheduledJobs() {
  cron.schedule('0 21 * * *', async () => {
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

  cron.schedule('0 12,21 * * *', async () => {
    logger.info('Starting Jikan episode retry');
    try {
      await jikanEpisodeRetry();
      logger.info('Jikan episode retry complete.');
    } catch (err) {
      logger.error(`Jikan episode retry failed: ${err}`);
    }
  });
}

import logger from '../../logs/logger';
import { SyncState } from '../../models/syncState.model';
import { formatAnimeDetails } from '../../services/anime.service';
import { fetchAniList, fetchAnimeByIds } from '../../services/fetchAnimePage';
import { processBatch } from './seedAnimeLoad';
import connectDB from '../../config/db';
// import your db connection helper here

const UPDATED_QUERY = `
  query ($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) { id updatedAt }
    }
  }
`;

const PER_PAGE = 50;
const DELAY_MS = 2100;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= attempts) throw err;
      logger.error(`Request failed (attempt ${i}/${attempts}), retrying`, err);
      await delay(5000 * i);
    }
  }
}

async function main() {
  const [sinceArg, startArg, maxArg] = process.argv.slice(2);

  if (!sinceArg) {
    throw new Error('First arg is required, e.g. 2026-09-22T00:00:00Z');
  }

  const since = new Date(sinceArg);

  if (isNaN(since.getTime())) {
    throw new Error('First arg must be a valid ISO date');
  }

  const startId = Number(startArg ?? 1);
  const maxId = Number(maxArg ?? 220000);

  await connectDB(); // replace with your own connect call

  // pass 1: find changed ids (light query)
  const changedIds: number[] = [];
  let newest: Date | null = null;

  for (let id = startId; id <= maxId; id += PER_PAGE) {
    const ids = Array.from({ length: PER_PAGE }, (_, i) => id + i).filter(
      (x) => x <= maxId
    );
    const result = await withRetry(() => fetchAniList(UPDATED_QUERY, { ids }));

    for (const media of result.media) {
      const updatedAt = new Date(media.updatedAt * 1000);
      if (updatedAt > since) {
        changedIds.push(media.id);
        if (!newest || updatedAt > newest) newest = updatedAt;
      }
    }

    if (((id - startId) / PER_PAGE) % 100 === 0) {
      logger.info(`Scan at id ${id}, ${changedIds.length} changed so far`);
    }
    await delay(DELAY_MS);
  }

  logger.info(`Scan done: ${changedIds.length} changed anime`);

  // pass 2: fetch details and write (existing query + pipeline)
  for (let i = 0; i < changedIds.length; i += PER_PAGE) {
    const page = await withRetry(() =>
      fetchAnimeByIds(changedIds.slice(i, i + PER_PAGE))
    );
    await processBatch(page.media.map(formatAnimeDetails));
    logger.info(
      `Wrote ${Math.min(i + PER_PAGE, changedIds.length)}/${changedIds.length}`
    );
    await delay(DELAY_MS);
  }

  // only reached if nothing threw
  if (newest) {
    await SyncState.updateOne(
      { key: 'anilist-sync' },
      { lastSyncedAt: newest }
    );
    logger.info(`SyncState set to ${newest.toISOString()}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('Manual sync failed', err);
    process.exit(1);
  });

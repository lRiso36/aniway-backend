import logger from '../logs/logger';
import { SyncState } from '../models/syncState.model';
import { ANIME_DELTA_QUERY } from '../queries/updateAnimeQuery';
import { processBatch } from '../scripts/animeSeed/seedAnimeLoad';
import { formatAnimeDetails } from '../services/anime.service';
import { fetchAniList } from '../services/fetchAnimePage';
import { AniListMediaDetailResponse } from '../types/anilist.types';

const PER_PAGE = 50;
const MAX_PAGES = 100; // AniList won't serve past 5000 entries

const yearRange = (from: number, to: number) => ({
  greater: (from - 1) * 10000 + 9999,
  lesser: to * 10000 + 9999,
});

const PARTITIONS: { greater?: number; lesser?: number }[] = [
  { greater: 20269999 }, // 2027 and later (announced)
  ...[2026, 2025, 2024].map((y) => yearRange(y, y)),
  ...Array.from({ length: 18 }, (_, i) => {
    const to = 2023 - i * 3;
    return yearRange(to - 2, to); // 2021-2023 ... 1970-1972
  }),
  { lesser: 19699999 }, // before 1970
];
export async function anilistDeltaSync() {
  const syncState = await SyncState.findOneAndUpdate(
    { key: 'anilist-sync' },
    { $setOnInsert: { lastSyncedAt: null } },
    { upsert: true, new: true }
  );

  const lastSyncedAt = syncState.lastSyncedAt;
  const changedAnimeIds: number[] = [];
  let maxUpdatedAt: Date | null = null;

  for (const partition of PARTITIONS) {
    const changedAnime: AniListMediaDetailResponse[] = []; // raw AniList anime objects, collected as we go
    let page = 1;
    let keepGoing = true;

    while (keepGoing) {
      if (page > MAX_PAGES) {
        throw new Error(
          `Partition ${JSON.stringify(partition)} passed ${MAX_PAGES} pages, split it`
        );
      }

      const result = await fetchAniList(ANIME_DELTA_QUERY, {
        page,
        perPage: PER_PAGE,
        startGreater: partition.greater,
        startLesser: partition.lesser,
      });

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

        logger.info(
          `Delta sync: ${anime.id} ${anime.title?.romaji} (${anime.startDate?.year}) updated ${updatedAt.toISOString()}`
        );

        if (!maxUpdatedAt || updatedAt > maxUpdatedAt) {
          maxUpdatedAt = updatedAt;
        }
      }
      if (mediaList.length < PER_PAGE) keepGoing = false; //no more pages
      page++;
    }

    if (changedAnime.length > 0) {
      await processBatch(changedAnime.map(formatAnimeDetails));
    }
  }

  //change new sync state
  if (maxUpdatedAt) {
    await SyncState.updateOne(
      { key: 'anilist-sync' },
      { lastSyncedAt: maxUpdatedAt }
    );
  }

  logger.info(
    `Complete anilistDeltaSync updated ${changedAnimeIds.length} anime`
  );
  return changedAnimeIds;
}

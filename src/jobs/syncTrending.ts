import logger from '../logs/logger';
import AnimeModel from '../models/anime.model';
import { ANIME_TRENDING_QUERY } from '../queries/trendingAnimeQuery';
import { fetchAniList } from '../services/fetchAnimePage';
import { AniListTrendingResult } from '../types/anilist.types';

export async function syncTrending() {
  const trendingAnime: AniListTrendingResult[] = [];
  let page = 1;

  while (page <= 10) {
    const result = await fetchAniList(ANIME_TRENDING_QUERY, {
      page,
      perPage: 50,
    });
    const mediaList = result.media;

    for (const anime of mediaList) {
      trendingAnime.push(anime);
    }
    if (result.pageInfo.hasNextPage) {
      page++;
    } else {
      break;
    }
  }

  await processTrendingAnime(trendingAnime);
  logger.info(`syncTrending updated ${trendingAnime.length} anime`);
}

async function processTrendingAnime(animeList: AniListTrendingResult[]) {
  const trendingIds = animeList.map((anime) => anime.id);

  const animeBulkMap = animeList.map((anime) => ({
    updateOne: {
      filter: { anilistId: anime.id },
      update: {
        $set: {
          trending: anime.trending,
        },
      },
    },
  }));

  const resetOp = {
    updateMany: {
      filter: { anilistId: { $nin: trendingIds }, trending: { $gt: 0 } },
      update: { $set: { trending: 0 } },
    },
  };

  const animeBulkResult = await AnimeModel.bulkWrite(
    [...animeBulkMap, resetOp],
    {
      ordered: false,
    }
  );

  if (animeBulkResult.hasWriteErrors()) {
    logger.error(
      `Anime bulkWrite had ${animeBulkResult.getWriteErrorCount()} failures:`,
      animeBulkResult.getWriteErrors()
    );
  }
}

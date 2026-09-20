import fs from 'fs';
import AnimeModel from '../../models/anime.model';
import logger from '../../logs/logger';
import { fetchEpisodesForOneAnime } from '../../services/episode.service';
import {
  JikanEpisodeResult,
  UpdateEpisodeType,
} from '../../types/episodeData.types';
import connectDB from '../../config/db';

const OUTPUT_PATH = 'src/scripts/data/episodeDataSeed.jsonl';
const THROTTLE_MS = 6000; // TODO: set from Jikan docs

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getTargetAnime() {
  return AnimeModel.find(
    { detailsCached: true, episodesCached: { $ne: true } },
    { anilistId: 1, malId: 1, episodeCount: 1 }
  )
    .skip(20)
    .limit(3);
}

async function fetchAndWriteOneAnime(anime: UpdateEpisodeType) {
  if (!anime.malId) {
    logger.error(`Skipped anilistId ${anime.anilistId}, no malId`);
    return;
  }

  try {
    const episodes: JikanEpisodeResult[] = await fetchEpisodesForOneAnime(
      anime.malId
    );

    // build the { anilistId, episodes: [...] } record shape
    const mappedEpisodes = episodes.map((episode) => ({
      episodeNumber: episode.mal_id,
      title: episode.title,
      titleJapanese: episode.title_japanese,
      airedAt: episode.aired ? new Date(episode.aired) : null,
      filler: episode.filler,
      recap: episode.recap,
    }));

    const record = {
      anilistId: anime.anilistId,
      episodes: mappedEpisodes,
    };

    fs.appendFileSync(OUTPUT_PATH, JSON.stringify(record) + '\n');
  } catch (err) {
    logger.error(
      `Failed to fetch episodes for anilistId ${anime.anilistId} (malId ${anime.malId}): ${err}`
    );
  }
}

async function runFetch() {
  const targets = await getTargetAnime();
  for (const anime of targets) {
    await fetchAndWriteOneAnime(anime);
    await delay(THROTTLE_MS);
  }
}

connectDB()
  .then(() => runFetch())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Load script failed:', err);
    process.exit(1);
  });

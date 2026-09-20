import fs from 'fs';
import AnimeModel from '../../models/anime.model';
import logger from '../../logs/logger';
import { writeEpisodeData } from '../../types/episodeData.types';
import connectDB from '../../config/db';

const INPUT_PATH = 'src/scripts/data/episodeDataSeed.jsonl';

function readEpisodeLines(): writeEpisodeData[] {
  const fileContent = fs.readFileSync(INPUT_PATH, 'utf-8');
  const lines = fileContent.split('\n').filter((line) => line.trim() !== '');
  return lines.map((line) => JSON.parse(line));
}

async function loadOneAnimeEpisodes(record: writeEpisodeData) {
  try {
    const animeResult = await AnimeModel.findOneAndUpdate(
      { anilistId: record.anilistId },
      {
        $set: {
          episodes: record.episodes,
          episodesCached: true,
        },
      }
    );
    if (!animeResult)
      logger.error(`Anime with id ${record.anilistId} failed to update`);
  } catch (err) {
    logger.error(`Error updating anime with id ${record.anilistId}: ${err}`);
  }
}

async function runLoad() {
  const records = readEpisodeLines();
  for (const record of records) {
    await loadOneAnimeEpisodes(record);
  }
}

connectDB()
  .then(() => runLoad())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Load script failed:', err);
    process.exit(1);
  });

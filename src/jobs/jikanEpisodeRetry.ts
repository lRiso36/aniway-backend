import logger from '../logs/logger';
import AnimeModel from '../models/anime.model';
import {
  fetchEpisodesForOneAnime,
  JikanInfrastructureError,
} from '../services/episode.service';
import { JikanEpisodeResult } from '../types/episodeData.types';

async function getTargetAnime() {
  return AnimeModel.find(
    { detailsCached: true, episodesCached: { $ne: true } },
    { anilistId: 1, malId: 1 }
  );
}

export async function jikanEpisodeRetry() {
  let failures = 0;
  let success = [];
  let animeSpecificFailures: number[] = []; // hold anilistIds
  let attempted = 0;

  const targets = await getTargetAnime();
  for (const anime of targets) {
    if (!anime.malId) {
      logger.error(`Skipped anilistId ${anime.anilistId}, no malId`);
      continue;
    }

    attempted++;

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

      success.push(record);
    } catch (err) {
      if (err instanceof JikanInfrastructureError) {
        failures += 1;
        logger.error(`Failed on anime with id ${anime.anilistId}`);
      } else {
        logger.error(`Failed for a different reason`);
        animeSpecificFailures.push(anime.anilistId);
      }
    }
  }

  for (const record of success) {
    await AnimeModel.updateOne(
      { anilistId: record.anilistId },
      {
        $set: {
          episodes: record.episodes,
          episodesCached: true,
          jikanFailCount: 0,
          jikanFlagged: false,
        },
      }
    );
  }

  if (attempted > 0 && failures / attempted >= 0.65) {
    logger.error(
      `Likely Jikan outage: ${failures}/${attempted} failed. Skipping failure tracking this run.`
    );
  } else {
    for (const anilistId of animeSpecificFailures) {
      const updated = await AnimeModel.findOneAndUpdate(
        { anilistId },
        { $inc: { jikanFailCount: 1 } },
        { new: true } // return the doc AFTER the update
      );

      if (updated && updated.jikanFailCount >= 5 && !updated.jikanFlagged) {
        await AnimeModel.updateOne({ anilistId }, { jikanFlagged: true });
      }
    }
  }
}

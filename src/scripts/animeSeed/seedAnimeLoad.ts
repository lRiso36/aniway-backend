import fs from 'fs';
import {
  AniListDetailResult,
  AniListMediaDetailResponse,
} from '../../types/anilist.types';
import { formatAnimeDetails } from '../../services/anime.service';
import logger from '../../logs/logger';
import _ from 'lodash';
import CharacterModel from '../../models/character.model';
import VoiceActorModel from '../../models/voiceActor.model';
import StudioModel from '../../models/studio.model';
import AnimeModel from '../../models/anime.model';
import connectDB from '../../config/db';

const INPUT_PATH = 'src/scripts/data/anilistSeed.jsonl';
const BATCH_SIZE = 500;

function readAnimeLines(): AniListMediaDetailResponse[] {
  const fileContent = fs.readFileSync(INPUT_PATH, 'utf-8');
  const lines = fileContent.split('\n').filter((line) => line.trim() !== '');
  return lines.map((line) => JSON.parse(line));
}

async function loadAnimeData(animes: AniListDetailResult[]) {
  for (let i = 0; i < animes.length; i += BATCH_SIZE) {
    const batch = animes.slice(i, i + BATCH_SIZE);
    await processBatch(batch);
    logger.info(`batch ${i} to ${i + BATCH_SIZE} completed`);
  }
}

export async function processBatch(batch: AniListDetailResult[]) {
  const allCharacters = batch.flatMap((anime) => anime.characters);
  const allStudios = batch.flatMap((anime) => anime.studios);
  const allVoiceActors = allCharacters.flatMap(
    (characters) => characters.voiceActors
  );

  const uniqueCharacters = _.uniqBy(allCharacters, 'anilistId');
  const uniqueStudios = _.uniqBy(allStudios, 'anilistId');
  const uniqueVoiceActors = _.uniqBy(allVoiceActors, 'anilistId');

  //CHARACTERS
  const characterBulkMap = uniqueCharacters.map((character) => ({
    updateOne: {
      filter: { anilistId: character.anilistId },
      update: {
        $set: {
          anilistId: character.anilistId,
          name: character.name,
          image: character.image,
        },
      },
      upsert: true,
    },
  }));

  const characterBulkResult = await CharacterModel.bulkWrite(characterBulkMap, {
    ordered: false,
  });

  if (characterBulkResult.hasWriteErrors()) {
    logger.error(
      `Character bulkWrite had ${characterBulkResult.getWriteErrorCount()} failures:`,
      characterBulkResult.getWriteErrors()
    );
  }

  const savedCharacters = await CharacterModel.find(
    { anilistId: { $in: uniqueCharacters.map((c) => c.anilistId) } },
    { anilistId: 1, _id: 1 }
  );

  //VOICE ACTORS
  const voiceActorBulkMap = uniqueVoiceActors.map((actor) => ({
    updateOne: {
      filter: { anilistId: actor.anilistId },
      update: {
        $set: {
          anilistId: actor.anilistId,
          name: actor.name,
          image: actor.image,
        },
      },
      upsert: true,
    },
  }));

  const voiceActorBulkResult = await VoiceActorModel.bulkWrite(
    voiceActorBulkMap,
    { ordered: false }
  );

  if (voiceActorBulkResult.hasWriteErrors()) {
    logger.error(
      `Voice Actor bulkWrite had ${voiceActorBulkResult.getWriteErrorCount()} failures:`,
      voiceActorBulkResult.getWriteErrors()
    );
  }

  const savedVoiceActors = await VoiceActorModel.find(
    { anilistId: { $in: uniqueVoiceActors.map((c) => c.anilistId) } },
    { anilistId: 1, _id: 1 }
  );

  //STUDIOs
  const studiosBulkMap = uniqueStudios.map((studio) => ({
    updateOne: {
      filter: { anilistId: studio.anilistId },
      update: {
        $set: {
          anilistId: studio.anilistId,
          name: studio.name,
        },
      },
      upsert: true,
    },
  }));

  const studioBulkResult = await StudioModel.bulkWrite(studiosBulkMap, {
    ordered: false,
  });

  if (studioBulkResult.hasWriteErrors()) {
    logger.error(
      `Studio bulkWrite had ${studioBulkResult.getWriteErrorCount()} failures:`,
      studioBulkResult.getWriteErrors()
    );
  }

  const savedStudios = await StudioModel.find(
    { anilistId: { $in: uniqueStudios.map((c) => c.anilistId) } },
    { anilistId: 1, _id: 1 }
  );

  //Build lookup maps
  const characterById = new Map(
    savedCharacters.map((c) => [c.anilistId, c._id])
  );

  const voiceActorById = new Map(
    savedVoiceActors.map((va) => [va.anilistId, va._id])
  );

  const studioById = new Map(savedStudios.map((s) => [s.anilistId, s._id]));

  //loop through animes
  for (const anime of batch) {
    // build links
    const characterLinks = anime.characters.map((character) => ({
      character: characterById.get(character.anilistId)!,
      role: character.role,
      voiceActors: character.voiceActors.map((actor) => ({
        voiceActor: voiceActorById.get(actor.anilistId)!,
        language: actor.language,
      })),
    }));

    const studioLinks = anime.studios.map((studio) => ({
      studio: studioById.get(studio.anilistId)!,
      isAnimationStudio: studio.isAnimationStudio,
    }));

    const savedAnime = await AnimeModel.findOneAndUpdate(
      { anilistId: anime.anilistId },
      {
        $set: {
          ...anime,
          characters: characterLinks,
          studios: studioLinks,
          detailsCached: true,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    if (!savedAnime)
      logger.error(`Failed to save anime with id: ${anime.anilistId}`);
  }
  logger.info('Batch ');
}

async function runLoad() {
  const animes = readAnimeLines();
  const formatted = animes.map(formatAnimeDetails);
  await loadAnimeData(formatted);
}

// connectDB()
// .then(() => runLoad())
// .then(() => process.exit(0))
// .catch((err) => {
//     console.error('Load script failed:', err);
//     process.exit(1);
// })

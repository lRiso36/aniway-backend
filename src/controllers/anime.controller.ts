import { Request, Response } from 'express';

import BaseController from './base.controller';
import AnimeModel, { Anime } from '../models/anime.model';
import SearchCacheModel from '../models/search.model';
import logger from '../logs/logger';
import {
  searchAnimeHelper,
  getAnimeDetailsHelper,
} from '../services/anime.service';
import CharacterModel from '../models/character.model';
import _ from 'lodash';
import VoiceActorModel from '../models/voiceActor.model';
import StudioModel from '../models/studio.model';

class AnimeController extends BaseController<Anime> {
  constructor() {
    super(AnimeModel);
  }

  async searchAnime(req: Request, res: Response) {
    try {
      const query = String(req.query.q).trim().toLowerCase();

      if (!query) {
        return res.status(400).json({ message: 'No query provided' });
      }

      //search database for search query and matching results
      const cached = await SearchCacheModel.findOne({ query }).populate(
        'animeIds'
      );

      if (cached) {
        return res.status(200).json(cached.animeIds);
      }

      //if not in database, search api
      const apiResults = await searchAnimeHelper(query);

      //if no results, skip extra stuff and just save + return
      if (apiResults.length === 0) {
        const emptyCache = await SearchCacheModel.create({
          query,
          animeIds: [],
        });

        return res.status(200).json({
          emptyCache,
        });
      }

      //upsert each anime by anilistId in one round trip
      //ordered = false means one bad doc wont block the rest of the batch
      const bulkMap = apiResults.map((anime) => ({
        updateOne: {
          filter: { anilistId: anime.anilistId },
          update: { $set: anime },
          upsert: true,
        },
      }));

      await AnimeModel.bulkWrite(bulkMap, { ordered: false });

      //fetch them back since bulkwrite doesnt return full docs
      const savedAnimes = await AnimeModel.find({
        anilistId: { $in: apiResults.map((a) => a.anilistId) },
      });

      //on bulk write failure
      if (savedAnimes.length === 0) {
        throw new Error(`Failed to save any anime for query "${query}`);
      }

      if (savedAnimes.length < apiResults.length) {
        const savedIds = new Set(savedAnimes.map((a) => a.anilistId));
        const failedIds = apiResults
          .filter((a) => !savedIds.has(a.anilistId))
          .map((a) => a.anilistId);

        logger.error('Failed to save some anime during search:', {
          query,
          failedIds,
        });
      }

      //map _ids for the cache record
      const animeIds = savedAnimes.map((anime) => anime._id);

      //create entry in cache table
      await SearchCacheModel.create({
        query,
        animeIds,
      });

      return res.status(200).json({
        savedAnimes,
      });
    } catch (error) {
      logger.error('Error in search anime:', error);
      res.status(500).json({
        message: 'Something went wrong',
      });
    }
  }

  async getAnimeDetails(req: Request, res: Response) {
    try {
      const anilistId = Number(req.params.anilistId);

      if (!anilistId) {
        return res.status(400).json({ message: 'No ID provided' });
      }

      const cachedAnimeDetails = await AnimeModel.findOne({ anilistId })
        .populate('studios.studio')
        .populate('characters.character')
        .populate('characters.voiceActors.voiceActor');

      if (cachedAnimeDetails?.detailsCached) {
        return res.status(200).json(cachedAnimeDetails);
      }

      const animeDetails = await getAnimeDetailsHelper(anilistId);

      if (!animeDetails) {
        return res.status(500).json({
          message: 'Anime detail search failed.',
        });
      }

      //upsert characters
      const characterBulkMap = animeDetails.characters.map((character) => ({
        updateOne: {
          filter: { anilistId: character.anilistId },
          update: {
            $set: _.omitBy(
              {
                anilistId: character.anilistId,
                name: character.name,
                image: character.image,
              },
              (value) => value === undefined
            ),
          },
          upsert: true,
        },
      }));

      await CharacterModel.bulkWrite(characterBulkMap, { ordered: false });

      const savedCharacters = await CharacterModel.find({
        anilistId: { $in: animeDetails.characters.map((c) => c.anilistId) },
      });

      //upsert voice actors
      const allVoiceActors = animeDetails.characters.flatMap(
        (character) => character.voiceActors
      );

      const uniqueVoiceActors = _.uniqBy(allVoiceActors, 'anilistId');

      const voiceActorBulkMap = uniqueVoiceActors.map((actor) => ({
        updateOne: {
          filter: { anilistId: actor.anilistId },
          update: {
            $set: _.omitBy(
              {
                anilistId: actor.anilistId,
                name: actor.name,
                image: actor.image,
              },
              (value) => value === undefined
            ),
          },
          upsert: true,
        },
      }));

      await VoiceActorModel.bulkWrite(voiceActorBulkMap, { ordered: false });

      const savedVoiceActors = await VoiceActorModel.find({
        anilistId: { $in: uniqueVoiceActors.map((a) => a.anilistId) },
      });

      const studiosBulkMap = animeDetails.studios.map((studio) => ({
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

      await StudioModel.bulkWrite(studiosBulkMap, { ordered: false });

      const savedStudios = await StudioModel.find({
        anilistId: { $in: animeDetails.studios.map((a) => a.anilistId) },
      });

      //lookup map
      const characterById = new Map(
        savedCharacters.map((c) => [c.anilistId, c])
      );
      const voiceActorById = new Map(
        savedVoiceActors.map((va) => [va.anilistId, va])
      );
      const studioById = new Map(savedStudios.map((s) => [s.anilistId, s]));

      //get all required parts
      const characterLinks = animeDetails.characters.map((character) => ({
        character: characterById.get(character.anilistId)!._id,
        role: character.role,
        voiceActors: character.voiceActors.map((actor) => ({
          voiceActor: voiceActorById.get(actor.anilistId)!._id,
          language: actor.language,
        })),
      }));

      const studioLinks = animeDetails.studios.map((studio) => ({
        studio: studioById.get(studio.anilistId)!._id,
        isAnimationStudio: studio.isAnimationStudio,
      }));

      const savedAnime = await AnimeModel.findOneAndUpdate(
        { anilistId },
        {
          $set: {
            ...animeDetails,
            characters: characterLinks,
            studios: studioLinks,
            detailsCached: true,
          },
        },
        { upsert: true, new: true }
      );

      await savedAnime?.populate([
        'studios.studio',
        'characters.character',
        'characters.voiceActors.voiceActor',
      ]);

      return res.status(200).json(savedAnime);
    } catch (error) {
      logger.error('Error in search anime:', error);
      res.status(500).json({
        message: 'Something went wrong',
      });
    }
  }
}

const animeController = new AnimeController();

export default animeController;

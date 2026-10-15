import { Request, Response } from 'express';

import BaseController from './base.controller';
import AnimeModel, { Anime } from '../models/anime.model';
import { getAnimeDetailsHelper } from '../services/anime.service';
import CharacterModel from '../models/character.model';
import _ from 'lodash';
import VoiceActorModel from '../models/voiceActor.model';
import StudioModel from '../models/studio.model';
import {
  GetAnimeByIdSchema,
  GetRecommendedAnimeSchema,
  SearchAnimeSchema,
} from '../validators/anime.validators';
import { getRecommendedAnimes } from '../services/recommendation.service';
import logger from '../logs/logger';

class AnimeController extends BaseController<Anime> {
  constructor() {
    super(AnimeModel);
  }

  async getAnimeDetails(req: Request, res: Response) {
    try {
      const { anilistId } = GetAnimeByIdSchema.parse(req.params);

      const cachedAnimeDetails = await AnimeModel.findOne({ anilistId })
        .populate('studios.studio')
        .populate('characters.character')
        .populate('characters.voiceActors.voiceActor');

      if (cachedAnimeDetails?.detailsCached) {
        return res.status(200).json(cachedAnimeDetails);
      }

      const animeDetails = await getAnimeDetailsHelper(anilistId);

      if (!animeDetails) {
        throw new Error(this.ERROR_MESSAGES.NOT_FOUND);
      }

      //upsert characters
      const characterBulkMap = animeDetails.characters.map((character) => ({
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
            $set: {
              anilistId: actor.anilistId,
              name: actor.name,
              image: actor.image,
            },
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
      this.errorHandler(error as Error, req, res);
    }
  }

  async animeFilter(req: Request, res: Response) {
    const CARD_FIELDS = {
      anilistId: 1,
      malId: 1,
      titleEnglish: 1,
      titleRomaji: 1,
      displayTitle: 1,
      coverLarge: 1,
      coverExtraLarge: 1,
      bannerImage: 1,
      episodeCount: 1,
      coverImage: 1,
      averageScore: 1,
      trending: 1,
      genres: 1,
      description: 1,
      detailsCached: 1,
      startDate: 1,
      coverColor: 1,
    };
    try {
      const { q, genre, tag, year, season, format, status, sort, page, limit } =
        SearchAnimeSchema.parse(req.query);

      const filter: any = {};

      if (q) filter.$text = { $search: q };
      if (tag) filter['tags.name'] = { $in: tag };
      if (genre) filter.genres = { $in: genre };
      if (year) filter.seasonYear = Number(year);
      if (season) filter.season = season;
      if (format) filter.format = format;
      if (status) filter.status = status;

      const sortMap: Record<string, Record<string, 1 | -1>> = {
        POPULARITY_DESC: { popularity: -1 },
        SCORE_DESC: { averageScore: -1 },
        FAVOURITES_DESC: { favourites: -1 },
        TITLE: { displayTitle: 1 },
        TRENDING: { trending: -1 },
      };

      let sortObj;
      if (sort) {
        sortObj = sortMap[sort];
      } else if (q) {
        sortObj = { score: { $meta: 'textScore' } };
      } else {
        sortObj = sortMap['POPULARITY_DESC'];
      }

      const projection = q
        ? { ...CARD_FIELDS, score: { $meta: 'textScore' } }
        : CARD_FIELDS;

      const skip = (page - 1) * limit;

      const [results, totalCount] = await Promise.all([
        AnimeModel.find(filter, projection)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        AnimeModel.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return res.status(200).json({
        results,
        totalCount,
        totalPages,
      });
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  async getAnimeRecommendations(req: Request, res: Response) {
    try {
      const userId = req.meta!.user!._id;

      const { limit } = GetRecommendedAnimeSchema.parse(req.query);

      const recommendedAnime = await getRecommendedAnimes(userId, limit);

      return res.status(200).json(recommendedAnime);
    } catch (error) {
      logger.error(
        error instanceof Error ? (error.stack ?? error.message) : String(error)
      );
      console.error(error);
      this.errorHandler(error as Error, req, res);
    }
  }
}

const animeController = new AnimeController();

export default animeController;

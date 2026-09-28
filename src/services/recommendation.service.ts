import AnimeModel from '../models/anime.model';
import UserAnimeEntryModel from '../models/userAnimeEntry.model';
import { ANIME_CARD_FIELDS, AnimeCardData } from '../types/anilist.types';
import { UserAnimeEntryWithEmbedding } from '../types/embedAnime.types';
import { getEmbeddingCache } from './animeEmbedCache';

export async function getRecommendedAnimes(
  userId: string,
  limit: number = 20
): Promise<
  (AnimeCardData & {
    score: number | null;
  })[]
> {
  console.time('user-entries');
  const userAnime = (await UserAnimeEntryModel.find({
    user: userId,
    status: { $in: ['completed', 'watching', 'rewatching', 'paused'] },
  }).populate(
    'anime',
    'embedding'
  )) as unknown as UserAnimeEntryWithEmbedding[];
  console.timeEnd('user-entries');
  const filteredAnime = userAnime.filter(
    (entry) => entry.anime && entry.anime.embedding
  );

  if (filteredAnime.length > 0) {
    //weight all the anime entries
    // anime with favorite on it is 1.5 vs 1
    const totalWeight = filteredAnime.reduce(
      (sum, entry) => sum + (entry.isFavorite ? 1.5 : 1),
      0
    );

    //add all vectors together for one final vector newVec
    const weightedSum = filteredAnime.reduce((newVec, entry) => {
      const weight = entry.isFavorite ? 1.5 : 1;
      entry.anime.embedding.forEach((value, index) => {
        newVec[index] = (newVec[index] ?? 0) + value * weight;
      });
      return newVec;
    }, [] as number[]);

    //average out vector
    const userVector = weightedSum.map((value) => value / totalWeight);

    const userAnimeIds = new Set(
      filteredAnime.map((entry) => 
        entry.anime._id.toString()
    ));

    const allAnime = await getEmbeddingCache();

    const scored = allAnime
      .filter(
        (anime) => 
          !userAnimeIds.has(anime.id) &&
          anime.embedding.length === userVector.length)
      .map((anime) => ({
        animeId: anime.id,
        score: cosineSimilarity(anime.embedding, userVector),
      }));

    const sorted = scored.sort((a, b) => b.score - a.score);

    // sorted top score matches
    const topRecs = sorted.slice(0, limit);

    //map for faster lookup
    const scoreMap = new Map(topRecs.map((r) => [r.animeId, r.score]));

    // sorted top anime ids
    const topRecIds = [...scoreMap.keys()];

    const animeDocs = await AnimeModel.find({
      _id: { $in: topRecIds },
    })
      .select(ANIME_CARD_FIELDS)
      .lean();

    //map all ids and docs for shoter lookup
    const docMap = new Map(animeDocs.map((doc) => [doc._id.toString(), doc]));

    const animeResults: (AnimeCardData & { score: number })[] = [];

    for (const recId of topRecIds) {
      const currentAnimeDoc = docMap.get(recId);
      const currentAnimeScore = scoreMap.get(recId);

      if (!currentAnimeDoc || currentAnimeScore === undefined) continue;

      animeResults.push({
        ...currentAnimeDoc,
        _id: currentAnimeDoc._id.toString(),
        score: currentAnimeScore,
      });
    }

    return animeResults;
  } else {
    const animeDocs = await AnimeModel.find()
      .select(ANIME_CARD_FIELDS)
      .lean()
      .sort({ popularity: -1, favourites: -1 })
      .limit(limit);

    const animeResults: (AnimeCardData & { score: number | null })[] =
      animeDocs.map((anime) => ({
        ...anime,
        _id: anime._id.toString(),
        score: null,
      }));

    return animeResults;
  }
}

type Vector = number[] | Float32Array;

function dotProduct(a: Vector, b: Vector): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i]! * b[i]!;
  return sum;
}

function magnitude(v: Vector): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i]! * v[i]!;
  return Math.sqrt(sum);
}

function cosineSimilarity(vectorA: Vector, vectorB: Vector): number {
  const denom = magnitude(vectorA) * magnitude(vectorB);
  if (denom === 0) return 0;
  return dotProduct(vectorA, vectorB) / denom;
}

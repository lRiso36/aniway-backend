import AnimeModel from '../models/anime.model';
import UserAnimeEntryModel from '../models/userAnimeEntry.model';
import { UserAnimeEntryWithEmbedding } from '../types/embedAnime.types';

export async function getReccomendedAnimes(userId: string, limit: number = 20) {
  const userAnime = (await UserAnimeEntryModel.find({
    user: userId,
    status: { $in: ['completed', 'watching', 'rewatching', 'paused'] },
  }).populate(
    'anime',
    'embedding'
  )) as unknown as UserAnimeEntryWithEmbedding[];

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

    const userAnimeIds = userAnime.map((entry) => entry.anime._id);

    const allAnime = await AnimeModel.find({
      _id: { $nin: userAnimeIds },
      embedding: { $exists: true },
    }).select('embedding');

    const scored = allAnime.map((anime) => ({
      animeId: anime.id,
      score: cosineSimilarity(anime.embedding!, userVector),
    }));

    const sorted = scored.sort((a, b) => b.score - a.score);

    const topRecs = sorted.slice(0, limit);

    console.log(topRecs);

    //TODO: RETURN FULL ANIME
  }

  // TODO: UNHAPPY PATH POPULAR RECOMMEND
}

function dotProduct(vectorA: number[], vectorB: number[]): number {
  const dotProduct = vectorA.reduce(
    (sum, value, index) => sum + value * vectorB[index]!,
    0
  );
  return dotProduct;
}

function magnitude(vector: number[]): number {
  const squaredSum = vector.reduce((sum, value) => sum + value ** 2, 0);
  const magnitude = Math.sqrt(squaredSum);

  return magnitude;
}

function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  const cosineSimilarity =
    dotProduct(vectorA, vectorB) / (magnitude(vectorA) * magnitude(vectorB));
  return cosineSimilarity;
}

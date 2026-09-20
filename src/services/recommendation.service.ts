import AnimeModel from '../models/anime.model';
import UserAnimeEntryModel from '../models/userAnimeEntry.model';
import { AnimeCardData } from '../types/anilist.types';
import { UserAnimeEntryWithEmbedding } from '../types/embedAnime.types';

export async function getRecommendedAnimes(userId: string, limit: number = 20) {
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

    const scored = allAnime
      .filter((anime) => anime.embedding!.length === userVector.length)
      .map((anime) => ({
        animeId: anime.id.toString(),
        score: cosineSimilarity(anime.embedding!, userVector),
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
      .select(
        '_id anilistId malId titleEnglish titleRomaji displayTitle coverLarge coverExtraLarge bannerImage episodeCount averageScore genres description detailsCached startDate'
      )
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

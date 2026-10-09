import AnimeModel from '../models/anime.model';

type CachedEmbedding = { id: string; embedding: Float32Array };

let cache: CachedEmbedding[] | null = null;
let loading: Promise<CachedEmbedding[]> | null = null;

export async function getEmbeddingCache(): Promise<CachedEmbedding[]> {
  if (cache) return cache;
  loading ??= loadCache();
  return loading;
}

async function loadCache(): Promise<CachedEmbedding[]> {
  const docs = await AnimeModel.find({ embedding: { $exists: true } })
    .select('embedding')
    .lean();

  cache = docs.map((d) => ({
    id: d._id.toString(),
    embedding: Float32Array.from(d.embedding!),
  }));
  loading = null;
  return cache;
}

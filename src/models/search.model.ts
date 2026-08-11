// SearchCache
//   query: string, normalized (trim + lowercase), unique
//   animeIds: [ObjectId], ref: 'Anime'
//   cachedAt: Date, default now

import mongoose, { Schema, Types } from 'mongoose';

interface SearchCache {
  query: string;
  animeIds: Types.ObjectId[];
  cachedAt: Date;
}

const searchCacheSchema = new Schema<SearchCache>({
  query: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  animeIds: [{ type: Schema.Types.ObjectId, ref: 'Anime' }],
  cachedAt: { type: Date, required: true, default: Date.now },
});

searchCacheSchema.index(
  { cachedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 }
); // 7 days

const SearchCacheModel = mongoose.model<SearchCache>(
  'SearchCache',
  searchCacheSchema
);

export default SearchCacheModel;

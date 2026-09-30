// scheduleId - anilists own id for a single entry
// anilistId - how we will populate, id of anime
// anime: object Id ref of anime
// episode - episode airing
// airingAt - when its airing
// scheduleId - unique, make upserts, no duplicates
// airingAt - regular index

import mongoose, { Schema, Types } from 'mongoose';

interface Airing {
  scheduleId: number;
  anilistId: number;
  anime: Types.ObjectId;
  episode: number;
  airingAt: Date;
  isAdult: boolean;
}

const airingSchema = new Schema<Airing>(
  {
    scheduleId: { type: Number, required: true, unique: true },
    anilistId: { type: Number, required: true },
    anime: { type: Schema.Types.ObjectId, required: true, ref: 'Anime' },
    episode: { type: Number, required: true },
    airingAt: { type: Date, required: true },
    isAdult: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

airingSchema.index({ airingAt: 1, isAdult: 1 });

const AiringModel = mongoose.model<Airing>('Airing', airingSchema);

export default AiringModel;

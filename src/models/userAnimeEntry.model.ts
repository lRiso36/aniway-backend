import mongoose, { Schema, Types } from 'mongoose';

type WatchStatus =
  'watching' | 'rewatching' | 'completed' | 'planning' | 'paused' | 'dropped';

export interface UserAnimeEntry {
  user: Types.ObjectId;
  anime: Types.ObjectId;
  status: WatchStatus;
  currentEpisode: number;
  repeatCount: number;
  score?: number;
  isFavorite: boolean;
  startDate?: Date;
  finishDate?: Date;
  notes?: string;
}

const userAnimeEntrySchema = new Schema<UserAnimeEntry>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    anime: { type: Schema.Types.ObjectId, required: true, ref: 'Anime' },
    status: {
      type: String,
      enum: [
        'watching',
        'rewatching',
        'completed',
        'planning',
        'paused',
        'dropped',
      ],
      required: true,
      default: 'planning',
    },
    currentEpisode: { type: Number, required: true, default: 0 },
    // only ever changes when the user explicitly bumps it — never touched
    // automatically by status changes or episode progress
    repeatCount: { type: Number, required: true, default: 0 },
    score: { type: Number, min: 0, max: 10 },
    isFavorite: { type: Boolean, required: true, default: false },
    // startDate/finishDate reflect the most recent watch-through only;
    // they don't change unless the user explicitly updates them...
    // start date
    startDate: { type: Date },
    finishDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

// one entry per user per anime
// helps query faster as well
userAnimeEntrySchema.index({ user: 1, anime: 1 }, { unique: true });

const UserAnimeEntryModel = mongoose.model<UserAnimeEntry>(
  'UserAnimeEntry',
  userAnimeEntrySchema
);

export default UserAnimeEntryModel;

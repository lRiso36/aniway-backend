import mongoose, { Schema, Types } from 'mongoose';

type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

type MediaSource =
  | 'ORIGINAL'
  | 'MANGA'
  | 'LIGHT_NOVEL'
  | 'VISUAL_NOVEL'
  | 'VIDEO_GAME'
  | 'OTHER'
  | 'NOVEL'
  | 'DOUJINSHI'
  | 'ANIME'
  | 'WEB_NOVEL'
  | 'LIVE_ACTION'
  | 'GAME'
  | 'COMIC'
  | 'MULTIMEDIA_PROJECT'
  | 'PICTURE_BOOK';

type CharacterRole = 'MAIN' | 'SUPPORTING' | 'BACKGROUND';

type VoiceLanguage = 'ENGLISH' | 'JAPANESE';

interface FuzzyDate {
  year?: number;
  month?: number;
  day?: number;
}

interface Episode {
  episodeNumber: number;
  title?: string;
  titleJapanese?: string;
  airedAt?: Date;
  filler: boolean;
  recap: boolean;
  cachedAt: Date;
}

const episodeSchema = new Schema<Episode>(
  {
    episodeNumber: { type: Number, required: true },
    title: { type: String },
    titleJapanese: { type: String },
    airedAt: { type: Date },
    filler: { type: Boolean, required: true, default: false },
    recap: { type: Boolean, required: true, default: false },
    cachedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

interface StudioLink {
  studio: Types.ObjectId;
  isAnimationStudio: boolean;
}

const studioLinkSchema = new Schema<StudioLink>(
  {
    studio: { type: Schema.Types.ObjectId, required: true, ref: 'Studio' },
    isAnimationStudio: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

interface VoiceActorLink {
  voiceActor: Types.ObjectId;
  language: VoiceLanguage;
}

const voiceActorLinkSchema = new Schema<VoiceActorLink>(
  {
    voiceActor: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'VoiceActor',
    },
    language: { type: String, enum: ['ENGLISH', 'JAPANESE'], required: true },
  },
  { _id: false }
);

interface CharacterLink {
  character: Types.ObjectId;
  role: CharacterRole;
  voiceActors: VoiceActorLink[];
}

const characterLinkSchema = new Schema<CharacterLink>(
  {
    character: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Character',
    },
    role: {
      type: String,
      enum: ['MAIN', 'SUPPORTING', 'BACKGROUND'],
      required: true,
    },
    voiceActors: [voiceActorLinkSchema],
  },
  { _id: false }
);

interface ExternalLink {
  url: string;
  site: string;
  icon: string;
  color: string;
}

const ExternalLinksSchema = new Schema<ExternalLink>(
  {
    url: { type: String, required: true },
    site: { type: String, required: true },
    icon: { type: String },
    color: { type: String },
  },
  { _id: false }
);

type MediaFormat =
  'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';

type MediaStatus =
  'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';

export interface Anime {
  anilistId: number;
  titleEnglish?: string;
  titleRomaji: string;
  coverLarge: string;
  coverExtraLarge?: string;
  bannerImage?: string;
  episodeCount?: number;
  description?: string;
  cachedAt: Date;
  malId?: number;
  detailsCached: boolean;
  averageScore?: number;
  source?: MediaSource;
  season?: Season;
  seasonYear?: number;
  startDate?: FuzzyDate;
  endDate?: FuzzyDate;
  episodes?: Episode[];
  studios?: StudioLink[];
  characters?: CharacterLink[];
  genres?: string[];
  externalLinks?: ExternalLink[];
  format?: MediaFormat;
  status?: MediaStatus;
  duration?: number;
}

const animeSchema = new Schema<Anime>({
  anilistId: { type: Number, required: true, unique: true },
  titleEnglish: { type: String },
  titleRomaji: { type: String, required: true },
  coverLarge: { type: String, required: true },
  coverExtraLarge: { type: String },
  bannerImage: { type: String },
  episodeCount: { type: Number },
  description: { type: String },
  cachedAt: { type: Date, required: true, default: Date.now },
  malId: { type: Number },
  detailsCached: { type: Boolean, required: true, default: false },
  averageScore: { type: Number },
  source: {
    type: String,
    enum: [
      'ORIGINAL',
      'MANGA',
      'LIGHT_NOVEL',
      'VISUAL_NOVEL',
      'VIDEO_GAME',
      'OTHER',
      'NOVEL',
      'DOUJINSHI',
      'ANIME',
      'WEB_NOVEL',
      'LIVE_ACTION',
      'GAME',
      'COMIC',
      'MULTIMEDIA_PROJECT',
      'PICTURE_BOOK',
    ],
  },
  season: {
    type: String,
    enum: ['WINTER', 'SPRING', 'SUMMER', 'FALL'],
  },
  seasonYear: { type: Number },
  startDate: {
    year: { type: Number },
    month: { type: Number },
    day: { type: Number },
  },
  endDate: {
    year: { type: Number },
    month: { type: Number },
    day: { type: Number },
  },
  episodes: [episodeSchema],
  studios: [studioLinkSchema],
  characters: [characterLinkSchema],
  genres: [{ type: String }],
  externalLinks: [ExternalLinksSchema],
  format: {
    type: String,
    enum: ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'],
  },
  status: {
    type: String,
    enum: ['FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'],
  },
  duration: { type: Number },
});

const AnimeModel = mongoose.model<Anime>('Anime', animeSchema);

export default AnimeModel;

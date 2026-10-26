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

export interface Episode {
  episodeNumber: number;
  relativeNumber?: number;
  title?: string;
  titleJapanese?: string;
  titleRomaji?: string;
  runtime?: number; // minutes
  airedAt?: Date;
  filler?: boolean;
  recap?: boolean;
  cachedAt: Date;
}

const episodeSchema = new Schema<Episode>(
  {
    episodeNumber: { type: Number, required: true },
    relativeNumber: { type: Number },
    title: { type: String },
    titleJapanese: { type: String },
    titleRomaji: { type: String },
    runtime: { type: Number },
    airedAt: { type: Date },
    filler: { type: Boolean },
    recap: { type: Boolean },
    cachedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

interface StudioLink {
  studio: Types.ObjectId;
  isAnimationStudio: boolean;
  isMain: boolean;
}

const studioLinkSchema = new Schema<StudioLink>(
  {
    studio: { type: Schema.Types.ObjectId, required: true, ref: 'Studio' },
    isAnimationStudio: { type: Boolean, required: true, default: false },
    isMain: { type: Boolean, required: true, default: false },
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

interface Tag {
  name: string;
  rank: number; //how relevant it is to the anime
  isSpoiler: boolean; //blur out if its a spoiler for UX
}

const tagSchema = new Schema<Tag>(
  {
    name: { type: String, required: true },
    rank: { type: Number, required: true },
    isSpoiler: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

//id will join site to make a url link
interface Trailer {
  id: string;
  site: string;
  thumbnail: string | null;
}

const trailerSchema = new Schema<Trailer>(
  {
    id: { type: String, required: true },
    site: { type: String, required: true },
    thumbnail: { type: String },
  },
  { _id: false }
);

export interface Anime {
  anilistId: number; //
  titleEnglish?: string; //
  titleRomaji: string; //
  displayTitle: string;
  coverLarge: string; //
  coverExtraLarge?: string; //
  bannerImage?: string; //
  episodeCount?: number; //
  description?: string; //
  cachedAt: Date;
  malId?: number; //
  kitsuId?: string;
  detailsCached: boolean;
  averageScore?: number; //
  source?: MediaSource; //
  season?: Season; //
  seasonYear?: number; //
  startDate?: FuzzyDate; //
  endDate?: FuzzyDate; //
  episodes?: Episode[];
  episodesCached: boolean;
  aniZipCheckedAt?: Date;
  studios: StudioLink[]; //
  characters: CharacterLink[]; //
  genres: string[]; //
  externalLinks: ExternalLink[]; //
  format?: MediaFormat; //
  status?: MediaStatus; //
  duration?: number; //
  tags?: Tag[]; //
  synonyms: string[]; // alternate titles for search
  popularity: number; //how many have this in their list
  favourites: number; //how many favorited this
  trending: number;
  isAdult: boolean; //filtering no adult shows
  trailer?: Trailer; //
  coverColor?: string; //for UX design //
  jikanFailCount: number;
  jikanFlagged: boolean;
  isFeatured: boolean;
  embedding?: number[]; // for recommendation
}

const animeSchema = new Schema<Anime>({
  anilistId: { type: Number, required: true, unique: true },
  titleEnglish: { type: String },
  titleRomaji: { type: String, required: true },
  displayTitle: { type: String, required: true },
  coverLarge: { type: String, required: true },
  coverExtraLarge: { type: String },
  bannerImage: { type: String },
  episodeCount: { type: Number },
  description: { type: String },
  cachedAt: { type: Date, required: true, default: Date.now },
  malId: { type: Number },
  kitsuId: { type: String },
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
  episodesCached: { type: Boolean, required: true, default: false },
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
  tags: [tagSchema],
  synonyms: [{ type: String }],
  popularity: { type: Number, required: true, default: 0 },
  favourites: { type: Number, required: true, default: 0 },
  trending: { type: Number, required: true, default: 0 },
  isAdult: { type: Boolean, required: true, default: false },
  trailer: trailerSchema,
  coverColor: { type: String },
  jikanFailCount: { type: Number, default: 0 },
  jikanFlagged: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  embedding: { type: [Number] },
});

animeSchema.index({
  titleEnglish: 'text',
  titleRomaji: 'text',
  synonyms: 'text',
});

animeSchema.index({ genres: 1 });
animeSchema.index({ 'tags.name': 1 });
animeSchema.index({ seasonYear: 1 });
animeSchema.index({ season: 1 });
animeSchema.index({ format: 1 });
animeSchema.index({ status: 1 });

animeSchema.index({ popularity: -1 });
animeSchema.index({ averageScore: -1 });
animeSchema.index({ favourites: -1 });
animeSchema.index({ displayTitle: 1 });
animeSchema.index({ trending: -1 });

const AnimeModel = mongoose.model<Anime>('Anime', animeSchema);

export default AnimeModel;

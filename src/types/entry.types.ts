import { Types } from 'mongoose';
import { UserAnimeEntry } from '../models/userAnimeEntry.model';
import { AnimeCardData } from './anilist.types';

export interface UserAnimeEntryPopulated extends Omit<UserAnimeEntry, 'anime'> {
  _id: Types.ObjectId;
  anime: { _id: Types.ObjectId; anilistId: number };
  createdAt: Date;
  updatedAt: Date;
}

export type AnimeCardPopulated = Omit<AnimeCardData, '_id'> & {
  _id: Types.ObjectId;
};

export type UserAnimeEntryWithAnimePopulated = Omit<
  UserAnimeEntryPopulated,
  'anime'
> & {
  anime: AnimeCardPopulated;
};

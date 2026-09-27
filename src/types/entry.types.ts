import { Types } from 'mongoose';
import { UserAnimeEntry } from '../models/userAnimeEntry.model';

export interface UserAnimeEntryPopulated extends Omit<UserAnimeEntry, 'anime'> {
  _id: Types.ObjectId;
  anime: { _id: Types.ObjectId; anilistId: number };
  createdAt: Date;
  updatedAt: Date;
}

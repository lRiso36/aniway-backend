import { UserAnimeEntryPopulated } from '../types/entry.types';

export function mapEntry(entry: UserAnimeEntryPopulated) {
  return {
    _id: entry._id,
    user: entry.user,
    anime: entry.anime._id,
    anilistId: entry.anime?.anilistId,
    status: entry.status,
    currentEpisode: entry.currentEpisode ?? undefined,
    score: entry.score ?? undefined,
    startDate: entry.startDate ?? undefined,
    finishDate: entry.finishDate ?? undefined,
    repeatCount: entry.repeatCount,
    notes: entry.notes ?? undefined,
    isFavorite: entry.isFavorite,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

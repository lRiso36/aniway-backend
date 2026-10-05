import { AnimeCardData } from '../types/anilist.types';
import {
  AnimeCardPopulated,
  UserAnimeEntryPopulated,
  UserAnimeEntryWithAnimePopulated,
} from '../types/entry.types';

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

export function mapAnimeCard(anime: AnimeCardPopulated): AnimeCardData {
  return {
    _id: anime._id.toString(),
    anilistId: anime.anilistId,
    malId: anime.malId ?? undefined,
    titleEnglish: anime.titleEnglish ?? undefined,
    titleRomaji: anime.titleRomaji,
    displayTitle: anime.displayTitle ?? undefined,
    coverLarge: anime.coverLarge,
    coverExtraLarge: anime.coverExtraLarge ?? undefined,
    coverColor: anime.coverColor ?? undefined,
    bannerImage: anime.bannerImage ?? undefined,
    episodeCount: anime.episodeCount ?? undefined,
    averageScore: anime.averageScore ?? undefined,
    genres: anime.genres ?? [],
    description: anime.description ?? undefined,
    startDate: anime.startDate ?? undefined,
  };
}

export function mapEntryWithAnime(entry: UserAnimeEntryWithAnimePopulated) {
  return {
    ...mapEntry(entry),
    animeData: mapAnimeCard(entry.anime),
  };
}

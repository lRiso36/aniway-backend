export function buildEmbedAnimeText(anime: {
  titleRomaji: string;
  description: string;
  genres: string[];
  tags: { name: string; isSpoiler: boolean }[];
  studios: { studio: { name: string } }[];
}): string {
  const titleLine = `Title: ${anime.titleRomaji}`;
  const description = `Description: ${anime.description}`;
  const genres = `Genres: ${anime.genres.join(', ')}`;
  const tags = `Tags: ${anime.tags
    .filter((tag) => !tag.isSpoiler)
    .map((tag) => tag.name)
    .join(', ')}`;
  const studios = `Studios: ${anime.studios.map((studio) => studio.studio.name)}`;

  return `${titleLine}\n${description}\n${genres}\n${tags}\n${studios}`;
}

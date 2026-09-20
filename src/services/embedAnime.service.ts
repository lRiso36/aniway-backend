import openaiClient from '../config/openAiClient';
import { buildEmbedAnimeText } from '../utils/animeEmbedText.util';
import type { AnimeForEmbedding } from '../types/embedAnime.types';
import OpenAI from 'openai';
import logger from '../logs/logger';

export async function embedAnimeBatch(
  animeList: AnimeForEmbedding[],
  retries = 3
): Promise<number[][]> {
  try {
    const animeInputText = animeList.map((anime) => buildEmbedAnimeText(anime));

    const { data } = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: animeInputText,
    });

    const results = data.map((d) => d.embedding);

    return results;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        if (retries <= 0) {
          throw new Error(
            `Rate limited on request with ${animeList[0]?.titleRomaji} - ${animeList[animeList.length - 1]?.titleRomaji}`
          );
        }

        const waitMs = 1000 * Math.pow(2, 3 - retries);

        logger.error(
          `Rate limited on request with ${animeList[0]?.titleRomaji} - ${animeList[animeList.length - 1]?.titleRomaji}. Waiting ${waitMs} ms`
        );

        await new Promise((resolve) => setTimeout(resolve, waitMs));

        return embedAnimeBatch(animeList, retries - 1);
      } else {
        logger.error(`OpenAi error: ${error.status}`);
        throw new Error('OpenAI Error', { cause: error });
      }
    } else {
      logger.error('Error in embedAnimeBatch');
      throw new Error('Other error', { cause: error });
    }
  }
}

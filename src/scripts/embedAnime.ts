import connectDB from "../config/db";
import logger from "../logs/logger";
import AnimeModel from "../models/anime.model";
import { embedAnimeBatch } from "../services/embedAnime.service";
import { AnimeForEmbedding } from "../types/embedAnime.types";
import '../models/studio.model';

export async function fetchAnimeAndEmbed() {
    try {
        const animeToEmbed = await AnimeModel
            .find({
                embedding: { $exists: false }
            })
            .select('titleRomaji description genres tags studios')
            .populate('studios.studio') as unknown as AnimeForEmbedding[];

        const BATCH_SIZE = 50;

        for (let i = 0; i < animeToEmbed.length; i += BATCH_SIZE) {
            const batch = animeToEmbed.slice(i, i + BATCH_SIZE);

            //embedding come back in order
            const embeddings = await embedAnimeBatch(batch);

            //bulk write all 
            await AnimeModel.bulkWrite(
                batch.map((anime, index) => ({
                    updateOne: {
                        filter: { _id: anime._id },
                        update: { embedding: embeddings[index] }
                    },
                }))
            );

            logger.info(`Successfully updated embeddings for animes ${i} - ${i + BATCH_SIZE}`)

            await new Promise((resolve) => setTimeout(resolve, 250));
        }
    } catch (error) {
        logger.error(`fetchAnimeAndEmbed failed: ${error}`);
        throw error;
    }
}

connectDB()
.then(() => fetchAnimeAndEmbed())
.then(() => process.exit(0))
.catch((err) => {
    console.error('Load script failed:', err);
    process.exit(1);
})
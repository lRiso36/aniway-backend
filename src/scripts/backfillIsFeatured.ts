import connectDB from "../config/db";
import AnimeModel from "../models/anime.model";

// scripts/backfillIsFeatured.js

async function run() {
    const result = await AnimeModel.updateMany(
        { isFeatured: { $exists: false } },
        { $set: { isFeatured: false } }
    );
    console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount}`);
}



connectDB()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Load script failed:', err);
        process.exit(1);
    });

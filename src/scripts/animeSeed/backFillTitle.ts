// src/scripts/backfillDisplayTitle.ts

import connectDB from "../../config/db";
import AnimeModel from "../../models/anime.model";


async function backfillDisplayTitle() {
    // const cursor = AnimeModel.find({ displayTitle: { $exists: false } }).cursor();

    // let updatedCount = 0;

    // for await (const doc of cursor) {
    //     doc.displayTitle = doc.titleEnglish ?? doc.titleRomaji;
    //     await doc.save();
    //     updatedCount++;

    //     if (updatedCount % 500 === 0) {
    //         console.log(`Processed ${updatedCount} so far...`);
    //     }
    // }

    // console.log(`Backfilled displayTitle on ${updatedCount} documents.`);
    const total = await AnimeModel.countDocuments({});
const withTitle = await AnimeModel.countDocuments({ displayTitle: { $exists: true } });
console.log(`Total: ${total}, With displayTitle: ${withTitle}`);
}

connectDB()
    .then(() => backfillDisplayTitle())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Backfill script failed:', err);
        process.exit(1);
    });
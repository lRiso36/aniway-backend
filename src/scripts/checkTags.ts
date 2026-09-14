// e.g. src/scripts/checkTags.ts
import fs from 'fs'
import mongoose from "mongoose";
import AnimeModel, { Anime } from "../models/anime.model"; // adjust path
import connectDB from "../config/db";

const OUTPUT_PATH = 'src/scripts/data/tagInfo.jsonl';

async function main() {
    // const uniqueTags = await AnimeModel.distinct("tags.name");
    // const tags = uniqueTags.map((tag) => JSON.stringify(tag)).join('\n') + '\n'
    // fs.appendFileSync(OUTPUT_PATH, JSON.stringify(uniqueTags.length))
    // fs.appendFileSync(OUTPUT_PATH, tags);

    // console.log(uniqueTags.length, "unique tags");
    // console.log(uniqueTags);
    // const result = await AnimeModel.aggregate([
    //     { $project: { tagCount: { $size: { $ifNull: ["$tags", []] } } } },
    //     { $group: { _id: null, avgTags: { $avg: "$tagCount" }, maxTags: { $max: "$tagCount" } } },
    // ]);
    // console.log(result);
    const result = await AnimeModel.aggregate([
        { $project: { titleRomaji: 1, tagCount: { $size: { $ifNull: ["$tags", []] } } } },
        { $sort: { tagCount: -1 } },
        { $limit: 1 },
    ]);
    console.log(result);
}

connectDB()
    .then(() => main())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Load script failed:', err);
        process.exit(1);
    })
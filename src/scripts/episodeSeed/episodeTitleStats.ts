import mongoose from 'mongoose';
import AnimeModel from '../../models/anime.model';
import config from '../../config/config';
async function main() {
  await mongoose.connect(config.databaseURL!);

  const cached = await AnimeModel.countDocuments({ episodesCached: true });

  const [stats] = await AnimeModel.aggregate([
    { $match: { episodesCached: true } },
    { $unwind: '$episodes' },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        noTitle: {
          $sum: {
            $cond: [
              { $gt: [{ $strLenCP: { $ifNull: ['$episodes.title', ''] } }, 0] },
              0,
              1,
            ],
          },
        },
      },
    },
  ]);

  console.log({
    cached,
    total: stats?.total ?? 0,
    noTitle: stats?.noTitle ?? 0,
  });
  await mongoose.disconnect();
}

main();

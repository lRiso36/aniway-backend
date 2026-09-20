import { SyncState } from '../models/syncState.model';
import connectDB from '../config/db';

async function bootstrap() {
  await SyncState.findOneAndUpdate(
    { key: 'anilist-sync' },
    { lastSyncedAt: new Date('2026-08-29T19:00:00') },
    { upsert: true }
  );

  console.log('SyncState bootstrapped');
}

connectDB()
  .then(() => bootstrap())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Load script failed:', err);
    process.exit(1);
  });

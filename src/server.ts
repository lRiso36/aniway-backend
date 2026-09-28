import app from './app';
import config from './config/config';

import connectDB from './config/db';
import { startScheduledJobs } from './jobs/scheduler';
import { getEmbeddingCache } from './services/animeEmbedCache';

connectDB()
  .then(async () => {
    //recommended embeds one load
    await getEmbeddingCache();

    const server = app.listen(config.port, () => {
      console.log('Server running on port:', config.port);
      startScheduledJobs();
    });

    server.on('SIGINT', () => {
      console.log('Shutting down server...');
      server.close(() => {
        console.log('Server closed.');
      });
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });

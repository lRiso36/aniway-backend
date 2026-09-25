jest.mock('../utils/mailer.util', () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn().mockResolvedValue({ accepted: ['test@example.com'] }),
  },
}));
// hoist mock email before everything else

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// create in memory mongo instance and connect via generated uri
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]?.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

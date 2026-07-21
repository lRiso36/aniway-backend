import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model';

dotenv.config();

const run = async (): Promise<void> => {
  await mongoose.connect(process.env.DATABASE_URL as string);
  console.log('Connected to DB');

  const testUser = new User({
    username: 'testuser3',
    email: 'test2@example.com',
    password: 'hey',
  });

  const saved = await testUser.save();
  console.log('Saved user:', saved);

  await mongoose.disconnect();
  console.log('Disconnected');
};

try {
  run();
} catch (err) {
  console.error('Script failed:', err);
}

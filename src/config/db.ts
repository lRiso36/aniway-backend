import mongoose from 'mongoose';

import config from './config';

const connectDB = async (): Promise<void> => {

    if (!config.databaseURL) {
        console.error('DATABASE_URL is not defined in .env');
        return;
    }

    try {
        await mongoose.connect(config.databaseURL, {
            serverSelectionTimeoutMS: 5000, // fail fast instead of hanging
        });
        console.log('MongoDB connected');
    } catch (err) {
        if (err instanceof Error) {
            console.error(`MongoDB connection failed: ${err.message}`);
        } else {
            console.error('MongoDB connection failed with an unknown error');
        }
        throw err;
    }
};

export default connectDB;
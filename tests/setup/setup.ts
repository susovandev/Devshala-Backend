import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { connectDB, disconnectDB } from '../../src/config/database.js';

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await disconnectDB();
});

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';
import Logger from './logger.js';

let mongoServer: MongoMemoryServer;

export async function connectDB() {
  if (env.NODE_ENV === 'test') {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    Logger.info(
      `Testing database host: ${mongoServer?.getUri()}; Connected to database: ${mongoServer?.getUri()}`,
    );
  } else {
    const connectionInstance = await mongoose.connect(`${env.DATABASE_URI}/${env.SERVICE_NAME}`);
    Logger.info(`Database host: ${connectionInstance?.connection.host}`);
    Logger.info(`Connected to database: ${connectionInstance?.connection.db?.databaseName}`);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

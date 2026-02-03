import { Worker } from 'bullmq';
import Logger from '@config/logger.js';
import loginModel from 'models/login.model.js';
import { queueRedis } from '@config/queueRedis.js';

Logger.info('Login tracker worker ready for processing');

export const loginTrackerWorker = new Worker(
  'login-tracker',
  async (job) => {
    try {
      Logger.info(`Running login tracker job for user ${job.data.userId}`);
      const loginTrackerDoc = await loginModel.create(job.data);
      if (!loginTrackerDoc) {
        throw new Error('Login tracker document not found');
      }
    } catch (error) {
      Logger.error(`Failed to create login tracker document: ${(error as Error).message}`);
      throw error;
    }
  },
  {
    connection: queueRedis,
    concurrency: 5,
  },
);

loginTrackerWorker.on('failed', (job, error) => {
  Logger.error(`Failed to process login tracker job ${job!.data.userId}: ${error.message}`);
});

loginTrackerWorker.on('progress', (job) => {
  Logger.info(`Logout cleanup job in progress for user ${job!.data.userId}`);
});

loginTrackerWorker.on('completed', (job) => {
  Logger.info(`Login tracker job completed for user ${job.data.userId}`);
});

loginTrackerWorker.on('error', (error) => {
  Logger.error(`Login tracker worker error: ${error.message}`);
});

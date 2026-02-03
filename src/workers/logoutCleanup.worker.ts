import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import refreshTokenModel from 'models/refreshToken.model.js';
import emailModel, { EmailType } from 'models/email.model.js';
import verificationCodeModel from 'models/verificationCode.model.js';
import Logger from '@config/logger.js';
import { queueRedis } from '@config/queueRedis.js';

Logger.info('Logout cleanup worker ready for processing');

export const logoutCleanupWorker = new Worker(
  'logout-cleanup',
  async (job) => {
    const { userId } = job.data;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid userId');
    }

    Logger.info(`Running logout cleanup job for user ${userId}`);

    await Promise.all([
      refreshTokenModel.deleteMany({ userId }),

      emailModel.deleteMany({
        recipient: userId,
        type: {
          $in: [
            EmailType.FORGOT_PASSWORD,
            EmailType.PASSWORD_RESET,
            EmailType.EMAIL_VERIFICATION,
            EmailType.ACCOUNT_VERIFICATION,
          ],
        },
      }),

      verificationCodeModel.deleteMany({ userId }),
    ]);

    Logger.info(`Logout cleanup completed for user ${userId}`);
  },
  {
    connection: queueRedis,
    concurrency: 5,
  },
);

logoutCleanupWorker.on('failed', (job, error) => {
  Logger.error(`Logout cleanup job failed for user ${job!.data.userId}: ${error.message}`);
});

logoutCleanupWorker.on('progress', (job) => {
  Logger.info(`Logout cleanup job in progress for user ${job!.data.userId}`);
});

logoutCleanupWorker.on('completed', (job) => {
  Logger.info(`Logout cleanup job completed for user ${job.data.userId}`);
});

logoutCleanupWorker.on('error', (error) => {
  Logger.error(`Logout cleanup worker error: ${error.message}`);
});

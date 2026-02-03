import { queueRedis } from '@config/queueRedis.js';
import { Queue } from 'bullmq';

export const logoutCleanupQueue = new Queue('logout-cleanup', {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

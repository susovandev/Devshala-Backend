import { queueRedis } from '@config/queueRedis.js';
import { Queue } from 'bullmq';

export const registerQueue = new Queue('registerUser', {
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

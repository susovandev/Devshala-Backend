import { Queue } from 'bullmq';
import { redis } from '@config/redis.js';
import { queueRedis } from '@config/queueRedis.js';

export const loginTrackerQueue = new Queue('login-tracker', {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 50, // keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

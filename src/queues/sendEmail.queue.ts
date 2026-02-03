import { queueRedis } from '@config/queueRedis.js';
import { Queue } from 'bullmq';

export interface ISendEmailJob {
  emailId: string;
}

export const sendEmailQueue = new Queue('send-email', {
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

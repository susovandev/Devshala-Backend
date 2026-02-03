import { Worker, Job } from 'bullmq';
import Logger from '@config/logger.js';
import emailModel, { EmailStatus } from 'models/email.model.js';
import { sendEmailService } from 'mail/index.js';
import { ISendEmailJob } from 'queues/sendEmail.queue.js';
import { queueRedis } from '@config/queueRedis.js';

Logger.info('Send email worker ready for processing');

export const sendEmailWorker = new Worker(
  'send-email',
  async (job: Job<ISendEmailJob>) => {
    Logger.info(`Processing email job: ${job.id}`);
    const { emailId } = job.data;

    const emailDoc = await emailModel.findById(emailId);
    if (!emailDoc) {
      Logger.error(`Email document not found: ${emailId}`);
      throw new Error('Email document not found');
    }

    try {
      await sendEmailService({
        recipient: emailDoc.recipientEmail,
        subject: emailDoc.subject,
        htmlTemplate: emailDoc.body,
      });

      emailDoc.status = EmailStatus.SENT;
      emailDoc.sendAt = new Date();

      await emailDoc.save({ session: null, validateBeforeSave: false });

      Logger.info(`Email sent successfully: ${emailId}`);
    } catch (error) {
      emailDoc.status = EmailStatus.FAILED;
      await emailDoc.save();

      Logger.error(`Email sending failed: ${emailId}`, error);
      throw error;
    }
  },
  {
    connection: queueRedis,
    concurrency: 2,
  },
);

sendEmailWorker.on('failed', (job, error) => {
  Logger.error(`Failed to process email job ${job!.data}: ${error.message}`);
});

sendEmailWorker.on('progress', (job) => {
  Logger.info(`Send email job in progress: ${job!.data}`);
});

sendEmailWorker.on('completed', (job) => {
  Logger.info(`Send email job completed: ${job.data}`);
});

sendEmailWorker.on('error', (error) => {
  Logger.error(`Send email worker error: ${error.message}`);
});

import { Worker } from 'bullmq';
import Logger from '@config/logger.js';
import authHelper from '@modules/auth/auth.helper.js';
import verificationCodeModel, { VerificationType } from 'models/verificationCode.model.js';
import emailModel, { EmailSource, EmailStatus, EmailType } from 'models/email.model.js';
import { VERIFICATION_CODE_EXPIRATION_TIME } from 'constants/index.js';
import emailVerificationEmailTemplate from 'mail/templates/auth/emailVerification.template.js';
import { sendEmailService } from 'mail/index.js';
import userModel, { UserRole } from 'models/user.model.js';
import notificationModel, { NotificationType } from 'models/notification.model.js';
import { getSocketIO } from 'socket/socket.instance.js';
import { env } from '@config/env.js';
import { queueRedis } from '@config/queueRedis.js';

Logger.info('Register user worker ready for processing');

export const registerWorker = new Worker(
  'registerUser',
  async (job) => {
    const { newUser } = job.data;
    try {
      Logger.info(`Running register user job for user ${job.data.email}`);
      // 5. Generate random OTP
      const rawVerificationCode = authHelper.generateRandomOtp();
      if (!rawVerificationCode) {
        Logger.warn('Generating random OTP failed');
        throw new Error('Error occurred while generating raw verification code');
      }

      // 6. Hash Verification code
      const hashedVerificationHashCode = await authHelper.hashVerifyOtpHelper(
        rawVerificationCode.toString(),
      );
      if (!hashedVerificationHashCode) {
        Logger.warn('Hashing verification code failed');
        throw new Error('Error occurred while hashing verification code');
      }

      // 7. Store verificationHash code in db
      const newVerificationCodeRecord = await verificationCodeModel.create({
        userId: newUser._id,
        verificationCode: hashedVerificationHashCode,
        verificationCodeExpiration: new Date(Date.now() + VERIFICATION_CODE_EXPIRATION_TIME),
        verificationType: VerificationType.EMAIL_VERIFICATION,
      });

      // 8. Add Job to send verification email
      const newEmailRecord = await emailModel.create({
        recipient: newUser._id,
        recipientEmail: newUser.email,
        subject: 'Account Verification',
        source: EmailSource.SYSTEM,
        sendAt: new Date(),
        status: EmailStatus.PENDING,
        type: EmailType.EMAIL_VERIFICATION,
        body: emailVerificationEmailTemplate({
          USERNAME: newUser.username,
          SUPPORT_EMAIL: env.SUPPORT_EMAIL,
          OTP: rawVerificationCode.toString(),
          EXPIRY_MINUTES: VERIFICATION_CODE_EXPIRATION_TIME / 1000 / 60,
          YEAR: new Date().getFullYear(),
        }),
      });
      if (!newEmailRecord) {
      }

      await sendEmailService({
        subject: newEmailRecord.subject,
        recipient: newEmailRecord.recipientEmail,
        htmlTemplate: newEmailRecord.body,
      });

      const admin = await userModel.findOne({ role: UserRole.ADMIN, isDeleted: false });
      if (!admin) {
      }

      const adminNotification = await notificationModel.create({
        recipientId: admin?._id,
        actorId: newUser?._id,
        type: NotificationType.NEW_USER,
        message: `${newUser.username} has been registered`,
        isRead: false,
        redirectUrl: `/admin/users`,
      });

      const io = getSocketIO();
      io.to(`admin:`).emit('notification:new', {
        type: 'user',
        message: `${newUser.username} has been registered`,
      });

      io.to(`admin:${admin!._id}`).emit('notification:new', adminNotification);
    } catch (error) {
      Logger.error(`Failed to register user document: ${(error as Error).message}`);
      throw error;
    }
  },
  {
    connection: queueRedis,
    concurrency: 5,
  },
);

registerWorker.on('failed', (job, error) => {
  Logger.error(`Failed to process register user job ${job!.data.newUser.email}: ${error.message}`);
});

registerWorker.on('progress', (job) => {
  Logger.info(`Register user job in progress for user ${job!.data.newUser.email}`);
});

registerWorker.on('completed', (job) => {
  Logger.info(`Register user job completed for user ${job.data.newUser.email}`);
});

registerWorker.on('error', (error) => {
  Logger.error(`Register user worker error: ${error.message}`);
});

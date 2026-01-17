import userRepo from '@modules/user/user.repo.js';
import type { ISignupRequestBody, IVerifyEmailRequestBody } from './auth.types.js';
import { ConflictError, InternalServerError, NotFoundError } from '@libs/errors.js';
import authHelper from './auth.helper.js';
import type { IUserDocument } from 'models/user.model.js';
import authRepo from './auth.repo.js';
import verificationCodeModel, {
  VerificationStatus,
  VerificationType,
} from 'models/verificationCode.model.js';
import { VERIFICATION_CODE_EXPIRATION_TIME } from './auth.constants.js';
import { sendEmailService } from 'mail/index.js';
import emailVerificationEmailTemplate from 'mail/templates/auth/emailVerification.template.js';
import Logger from '@config/logger.js';

class AuthService {
  // TODO: Applying mongoose transaction, bullmq
  async signupService(params: ISignupRequestBody): Promise<IUserDocument | null> {
    Logger.debug('Signing up user...');
    const { username, email, password } = params;

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await userRepo.getUserByUsernameOrEmail({
      username,
      email: normalizedEmail,
    });
    if (existingUser) {
      Logger.warn('User already exists');
      throw new ConflictError(`Your account already exists`);
    }

    // Hashed password
    const hashPassword = await authHelper.hashPasswordHelper(password);
    if (!hashPassword) {
      Logger.error('Hashing password failed');
      throw new InternalServerError('Hashing password failed');
    }

    // Create new user in DB
    const user = await userRepo.createUser({
      username,
      email: normalizedEmail,
      passwordHash: hashPassword,
    });
    if (!user) {
      Logger.error('Creating user failed');
      throw new InternalServerError('Creating user failed');
    }

    // Generate Random OTP
    const verificationCode = authHelper.generateRandomOtp();
    if (!verificationCode) {
      Logger.error('Generating random OTP failed');
      throw new InternalServerError('Generating random OTP failed');
    }

    // Hash OTP
    const verificationCodeHash = authHelper.hashVerificationCodeHelper(verificationCode.toString());
    if (!verificationCodeHash) {
      Logger.error('Hashing verification code failed');
      throw new InternalServerError('Hashing verification code failed');
    }

    // Store OTP in DB
    const newEmailVerificationCode = await authRepo.createVerificationCode({
      userId: user._id.toString(),
      verificationCode: verificationCodeHash,
      verificationCodeExpiration: new Date(Date.now() + VERIFICATION_CODE_EXPIRATION_TIME),
      verificationType: VerificationType.EMAIL_VERIFICATION,
    });
    if (!newEmailVerificationCode) {
      Logger.error('Creating email verification code failed');
      throw new InternalServerError('Creating email verification code failed');
    }

    //Send email
    try {
      sendEmailService({
        recipient: user?.email,
        subject: 'Email Verification',
        htmlTemplate: emailVerificationEmailTemplate({
          USERNAME: user?.username,
          OTP: verificationCode.toString(),
          EXPIRY_MINUTES: VERIFICATION_CODE_EXPIRATION_TIME / 60,
        }),
      });
      Logger.info('Email sent successfully');
    } catch (error) {
      Logger.error(`Email sending error: ${(error as Error).message}`);
    }

    Logger.info('User signed up successfully');
    return user;
  }

  async verifyEmailService(params: IVerifyEmailRequestBody) {
    Logger.debug('Verifying email...');
    const { userId, verificationCode } = params;

    // Check user is already registered or nor by userId
    const user = await userRepo.getByUserId(userId);
    if (!user) {
      Logger.error('User not found');
      throw new NotFoundError('User not found for verification');
    }

    // Account state validation
    if (user.isDeleted || user.isBlocked || user.isDisabled) {
      throw new ConflictError('Account is not allowed to perform this action');
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      Logger.error('Email already verified');
      throw new ConflictError('Email already verified');
    }

    // Hash incoming code
    const verificationCodeHash = authHelper.hashVerificationCodeHelper(verificationCode);
    if (!verificationCodeHash) {
      Logger.error('Hashing verification code failed');
      throw new InternalServerError('Hashing verification code failed');
    }

    // Check if email verification code is valid
    const verificationRecord = await authRepo.findVerificationCode({
      userId,
      verificationCodeHash,
      verificationType: VerificationType.EMAIL_VERIFICATION,
      verificationStatus: VerificationStatus.PENDING,
    });
    if (!verificationRecord) {
      Logger.error('Email verification code not found');
      throw new ConflictError('Invalid Email verification code or expired');
    }

    // Check is email verification code expired
    if (verificationRecord.verificationCodeExpiration < new Date()) {
      Logger.error('Email verification code expired');
      verificationRecord.verificationStatus = VerificationStatus.EXPIRED;
      await verificationRecord.save();
      throw new ConflictError('Email verification code expired');
    }

    //  Atomic update
    await Promise.all([
      userRepo.markEmailAsVerified(userId),
      verificationCodeModel.updateOne(
        { _id: verificationRecord._id },
        { $set: { verificationStatus: VerificationStatus.USED } },
      ),
    ]);

    Logger.info(`Email verified successfully for user: ${userId}`);
    return user;
  }
}

export default new AuthService();

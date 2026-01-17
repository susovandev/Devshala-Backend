import userRepo from '@modules/user/user.repo.js';
import type { ISignupRequestBody } from './auth.types.js';
import { ConflictError, InternalServerError } from '@libs/errors.js';
import authHelper from './auth.helper.js';
import type { IUserDocument } from 'models/user.model.js';
import authRepo from './auth.repo.js';
import { VerificationType } from 'models/verificationCode.model.js';
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

    // Store OTP in DB
    const newEmailVerificationCode = await authRepo.createVerificationCode({
      userId: user._id.toString(),
      verificationCode: verificationCode.toString(),
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
          OTP: newEmailVerificationCode?.verificationCode,
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
}

export default new AuthService();

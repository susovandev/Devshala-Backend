import userRepo from '@modules/user/user.repo.js';
import type {
  ILoginRequestBody,
  ISignupRequestBody,
  IVerifyEmailRequestBody,
} from './auth.types.js';
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from '@libs/errors.js';
import authHelper from './auth.helper.js';
import type { IUserDocument } from 'models/user.model.js';
import authRepo from './auth.repo.js';
import verificationCodeModel, {
  VerificationStatus,
  VerificationType,
} from 'models/verificationCode.model.js';
import { REFRESH_TOKEN_TTL, VERIFICATION_CODE_EXPIRATION_TIME } from './auth.constants.js';
import { sendEmailService } from 'mail/index.js';
import emailVerificationEmailTemplate from 'mail/templates/auth/emailVerification.template.js';
import Logger from '@config/logger.js';
import { LoginStatus } from 'models/login.model.js';

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

  // TODO: send email for account verified message
  // TODO: Use corn job for verification status pending to expired after 24 hours
  async verifyEmailService(params: IVerifyEmailRequestBody) {
    Logger.debug('Verifying email...');
    const { userId, verificationCode } = params;

    // Check user is already registered or nor by userId
    const user = await userRepo.getByUserId(userId);
    if (!user) {
      Logger.error('User not found');
      throw new NotFoundError('User not found for verification');
    }

    // Account status validation
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

  // TODO: Applying mongoose transaction, bullmq
  async resendVerificationEmailService(email: string) {
    Logger.debug('Resending verification email...');

    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepo.getUserByUsernameOrEmail({ email: normalizedEmail });
    if (!user) {
      Logger.error('User not found');
      throw new NotFoundError('User not found for verification');
    }

    // Account status validation
    if (user.isDeleted || user.isBlocked || user.isDisabled) {
      throw new ConflictError('Account is not allowed to perform this action');
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      Logger.warn(`Resend OTP blocked: account already verified - ${normalizedEmail}`);
      throw new ConflictError('Your account is already verified');
    }

    // Check if email verification code is pending
    const verificationRecord = await authRepo.findVerificationCode({
      userId: user._id.toString(),
      verificationType: VerificationType.EMAIL_VERIFICATION,
      verificationStatus: VerificationStatus.PENDING,
    });
    if (verificationRecord) {
      Logger.warn(`Resend OTP blocked: email verification code is pending - ${normalizedEmail}`);
      throw new ConflictError('Email verification code is pending');
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

    await Promise.all([
      authRepo.createVerificationCode({
        userId: user._id.toString(),
        verificationCode: verificationCodeHash,
        verificationCodeExpiration: new Date(Date.now() + VERIFICATION_CODE_EXPIRATION_TIME),
        verificationType: VerificationType.EMAIL_VERIFICATION,
      }),
      sendEmailService({
        recipient: normalizedEmail,
        subject: 'Email verification code',
        htmlTemplate: emailVerificationEmailTemplate({
          USERNAME: user?.username,
          OTP: verificationCode.toString(),
          EXPIRY_MINUTES: VERIFICATION_CODE_EXPIRATION_TIME / 60,
        }),
      }),
    ]);
    Logger.info('User signed up successfully');
    return user;
  }

  async loginService(params: ILoginRequestBody) {
    Logger.debug('Logging in...');

    const { email, password, ip, userAgent } = params;
    const normalizedEmail = email.trim().toLowerCase();

    // If user exits in DB
    const user = await userRepo.getUserByUsernameOrEmail({
      email: normalizedEmail,
    });
    if (!user) {
      Logger.error('User not found');
      await authRepo.createLoginRecord({
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.FAILED,
      });
      throw new UnauthorizedError('Incorrect email or password');
    }

    // Check user email is verified or not
    if (!user.isEmailVerified) {
      Logger.error('Email not verified');
      await authRepo.createLoginRecord({
        userId: user?._id.toString(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.FAILED,
      });
      throw new UnauthorizedError('Email is not verified');
    }

    // If user is blocked or disabled or deleted
    if (user.isBlocked || user.isDisabled || user.isDeleted) {
      Logger.error('User is blocked or disabled or deleted');
      await authRepo.createLoginRecord({
        userId: user?._id.toString(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.FAILED,
      });
      throw new UnauthorizedError('User is blocked or disabled or deleted');
    }

    // Compare password
    const isPasswordCorrect = await authHelper.comparePasswordHelper(password, user.passwordHash);
    if (!isPasswordCorrect) {
      Logger.error('Incorrect password');
      await authRepo.createLoginRecord({
        userId: user?._id.toString(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.FAILED,
      });
      throw new UnauthorizedError('Incorrect email or password');
    }

    // Store user ip and user agent in login db
    const storeLoggedInRecord = await authRepo.createLoginRecord({
      userId: user._id.toString(),
      lastLoginIp: ip,
      lastLoginUserAgent: userAgent,
      lastLoginStatus: LoginStatus.SUCCESS,
    });
    if (!storeLoggedInRecord) {
      Logger.error('Storing login record failed');
      throw new InternalServerError('Storing login record failed');
    }

    // Generate tokens
    const { accessToken, refreshToken } = authHelper.signAccessTokenAndRefreshToken(user);
    if (!accessToken || !refreshToken) {
      Logger.error('Generating access token or refresh token failed');
      throw new InternalServerError('Generating access token or refresh token failed');
    }

    // Store refreshToken in db
    const storeRefreshTokenRecord = await authRepo.createRefreshTokenRecord({
      userId: user._id.toString(),
      tokenHash: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
      ip,
      userAgent,
    });
    if (!storeRefreshTokenRecord) {
      Logger.error('Storing refresh token record failed');
      throw new InternalServerError('Storing refresh token record failed');
    }

    return { accessToken, refreshToken };
  }
}

export default new AuthService();

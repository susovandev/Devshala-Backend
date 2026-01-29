import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import verificationCodeModel, {
  VerificationStatus,
  VerificationType,
} from 'models/verificationCode.model.js';
import {
  REFRESH_TOKEN_EXPIRATION_TIME,
  RESET_PASSWORD_TOKEN_EXPIRATION_TIME,
  VERIFICATION_CODE_EXPIRATION_TIME,
} from 'constants/index.js';
import emailModel, { EmailStatus } from 'models/email.model.js';
import emailVerificationEmailTemplate from 'mail/templates/auth/emailVerification.template.js';
import { env } from '@config/env.js';
import { sendEmailService } from 'mail/index.js';
import authRepo from '@modules/auth/auth.repo.js';
import { LoginStatus } from 'models/login.model.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from '@modules/auth/auth.constants.js';
import forgotPasswordEmailTemplate from 'mail/templates/auth/forgotPasswordEmail.template.js';
import { getSocketIO } from 'socket/socket.instance.js';
import notificationModel, { NotificationType } from 'models/notification.model.js';

class UserAuthController {
  async getUserRegisterPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user register page...');

      // If user already logged in then redirect to home
      if (req.session.user) {
        Logger.warn('User is already logged in');

        req.flash('error', 'You are already logged in');
        return res.redirect('/');
      }

      return res.render('users/auth/register', {
        title: 'User | Register',
        pageTitle: 'User Register',
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/register');
    }
  }

  async userRegisterHandler(req: Request, res: Response) {
    try {
      Logger.info(`User Register route called with data: ${JSON.stringify(req.body)}`);

      const { username, email, password } = req.body;

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Check user is already registered or not by email or username
      const user = await userModel.findOne({
        $or: [{ username }, { email: normalizedEmail }],
      });

      // 2. If user is already registered, throw error
      if (user) {
        Logger.warn(`User is already exits with email: ${normalizedEmail}`);

        req.flash('error', 'Your account is already registered please try login');
        return res.redirect('/users/auth/login');
      }

      // 3. Hash Password
      const hashPassword = await authHelper.hashPasswordHelper(password);
      if (!hashPassword) {
        Logger.warn('Hashing password failed');

        req.flash('error', 'Error occurred while registering your account please try again');
        return res.redirect('/users/auth/register');
      }

      // 4. Create new user in DB
      const newUser = await userModel.create({
        username,
        email,
        passwordHash: hashPassword,
      });
      if (!newUser) {
        Logger.warn('Creating user failed');

        req.flash('error', 'Error occurred while registering your account please try again');
        return res.redirect('/users/auth/register');
      }

      // 5. Generate random OTP
      const rawVerificationCode = authHelper.generateRandomOtp();
      if (!rawVerificationCode) {
        Logger.warn('Generating random OTP failed');

        req.flash('error', 'Error occurred while registering your account please try again');
        return res.redirect('/users/auth/register');
      }

      // 6. Hash Verification code
      const hashedVerificationHashCode = await authHelper.hashVerifyOtpHelper(
        rawVerificationCode.toString(),
      );
      if (!hashedVerificationHashCode) {
        Logger.warn('Hashing verification code failed');

        req.flash('error', 'Error occurred while registering your account please try again');
        return res.redirect('/users/auth/register');
      }

      // 7. Store verificationHash code in db
      const newVerificationCodeRecord = await verificationCodeModel.create({
        userId: newUser._id,
        verificationCode: hashedVerificationHashCode,
        verificationCodeExpiration: new Date(Date.now() + VERIFICATION_CODE_EXPIRATION_TIME),
        verificationType: VerificationType.EMAIL_VERIFICATION,
      });
      if (!newVerificationCodeRecord) {
        Logger.warn('Creating verification code failed');

        req.flash('error', 'Error occurred while registering your account please try again');
        return res.redirect('/users/auth/register');
      }

      // 8. Add Job to send verification email
      const newEmailRecord = await emailModel.create({
        recipient: newUser._id,
        recipientEmail: newUser.email,
        subject: 'Account Verification',
        source: UserRole.USER,
        sendAt: new Date(),
        status: EmailStatus.PENDING,
        body: emailVerificationEmailTemplate({
          USERNAME: newUser.username,
          SUPPORT_EMAIL: env.SUPPORT_EMAIL,
          OTP: rawVerificationCode.toString(),
          EXPIRY_MINUTES: VERIFICATION_CODE_EXPIRATION_TIME / 60,
          YEAR: new Date().getFullYear(),
        }),
      });
      if (!newEmailRecord) {
        Logger.warn('Creating email failed');

        req.flash('error', 'Error occurred while registering your account please try again');
        return res.redirect('/users/auth/register');
      }

      await sendEmailService({
        subject: newEmailRecord.subject,
        recipient: newEmailRecord.recipientEmail,
        htmlTemplate: newEmailRecord.body,
      });

      // 9. Add pending user to session
      req.session.user = {
        _id: newUser._id.toString(),
        isEmailVerified: false,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        avatarUrl: newUser.avatarUrl || null,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };

      const admin = await userModel.findOne({ role: UserRole.ADMIN, isDeleted: false });
      if (!admin) {
        Logger.warn('Admin not found');

        req.flash('error', 'Error occurred while registering your account please try again');
        return res.redirect('/users/auth/login');
      }

      const adminNotification = await notificationModel.create({
        recipientId: admin?._id,
        actorId: newUser?._id,
        type: NotificationType.NEW_USER,
        message: `${newUser.username} has been registered`,
        isRead: false,
        redirectUrl: `/admin/users`,
      });
      if (!adminNotification) {
        Logger.warn('Notification not created');

        req.flash('error', 'Error occurred while registering your account please try again');
        return res.redirect('/users/auth/login');
      }
      const io = getSocketIO();
      io.to(`admin:`).emit('notification:new', {
        type: 'user',
        message: `${newUser.username} has been registered`,
      });

      io.to(`admin:${admin._id}`).emit('notification:new', adminNotification);

      Logger.info('User has been registered successfully');
      req.flash('success', 'Account Verification email has been sent to your email');
      return res.redirect(`/users/auth/verify-otp`);
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', `${(error as Error).message}`);
      return res.redirect('/users/auth/register');
    }
  }

  async getUserVerifyOtpPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user verify email page...');

      // Check if user is already logged in then redirect to home
      if (req.session.user && req.session.user.isEmailVerified === true) {
        Logger.warn('User is already logged in');

        req.flash('error', 'You are already logged in');
        return res.redirect('/');
      }

      // 1. Get userId from session
      const userId = req.session.user?._id;
      if (!userId) {
        Logger.warn('User id not found');

        req.flash('error', 'User id not found please try again');
        return res.redirect('/users/auth/register');
      }

      return res.render('users/auth/verify-otp', {
        title: 'User | Verify Otp',
        pageTitle: 'User Verify Otp',
        userId,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/register');
    }
  }

  async userVerifyOtpHandler(req: Request, res: Response) {
    try {
      Logger.info('Verifying user otp...');

      const { otp, userId } = req.body;

      // Validate user id
      if (!userId) {
        Logger.warn('User id not found');

        req.flash('error', 'User id not found please try again');
        return res.redirect('/users/auth/register');
      }

      // 1. Find user by id
      const user = await userModel.findById(userId);
      if (!user) {
        Logger.warn('User not found');

        req.flash('error', 'Your account is not registered Please register first');
        return res.redirect('/users/auth/register');
      }

      // 2. Check if user has already verified or not
      if (user.isEmailVerified) {
        Logger.warn('Email already verified');

        req.flash('error', 'Email already verified please login');
        return res.redirect('/users/auth/login');
      }

      // 3. Find verification code record by user id
      const verificationCodeRecord = await verificationCodeModel.findOne({
        userId,
        verificationType: VerificationType.EMAIL_VERIFICATION,
        verificationCodeExpiration: { $gt: new Date() },
        verificationStatus: VerificationStatus.PENDING,
      });
      if (!verificationCodeRecord) {
        Logger.warn('Verification code not found');

        req.flash('error', 'Invalid otp please try again');
        return res.redirect('/users/auth/verify-otp');
      }

      // 4. Verify otp
      const isOtpVerified = await authHelper.verifyOtpHelper(
        otp,
        verificationCodeRecord.verificationCode,
      );
      if (!isOtpVerified) {
        Logger.warn('Invalid otp');

        req.flash('error', 'Invalid otp please try again');
        return res.redirect('/users/auth/verify-otp');
      }

      // 5. Update user status
      user.isEmailVerified = true;
      user.status = UserStatus.ACTIVE;
      await user.save({ validateBeforeSave: false });

      // 6. Update verification code record status
      verificationCodeRecord.verificationStatus = VerificationStatus.USED;
      await verificationCodeRecord.save({ validateBeforeSave: false });

      Logger.debug('User has been verified successfully');

      req.flash('success', 'Account has been verified successfully please login');
      return res.redirect('/users/auth/login');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/login');
    }
  }

  async getUserResendOtpPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user resend otp page...');

      // Check if user is already logged in then redirect to home
      if (req.session.user && req.session.user.isEmailVerified === true) {
        Logger.warn('User is already logged in');

        req.flash('error', 'You are already logged in');
        return res.redirect('/');
      }

      const userId = req.session.user?._id;
      if (!userId) {
        Logger.warn('User id not exits on query params');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/users/auth/login');
      }

      return res.render('users/auth/resend-otp', {
        title: 'User | Resend Otp',
        pageTitle: 'User Resend Otp',
        userId,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/login');
    }
  }

  async userResendOtpHandler(req: Request, res: Response) {
    try {
      Logger.info('Resending user OTP...');
      const { userId } = req.body;

      // 1. Validate user id
      const user = await userModel.findOne({
        _id: userId,
        isDeleted: false,
        status: UserStatus.PENDING,
        isEmailVerified: false,
      });

      if (!user) {
        Logger.warn('Invalid resend OTP request');

        req.flash('error', 'Your account is not eligible for OTP verification');
        return res.redirect('/users/auth/login');
      }

      //2 Get latest verification code
      const latestOtp = await verificationCodeModel
        .findOne({
          userId: user._id.toString(),
          verificationType: VerificationType.EMAIL_VERIFICATION,
        })
        .sort({ createdAt: -1 });

      const now = new Date();

      //3. If OTP exists & still valid → BLOCK resend
      if (
        latestOtp &&
        latestOtp.verificationStatus === VerificationStatus.PENDING &&
        latestOtp.verificationCodeExpiration > now
      ) {
        Logger.warn('OTP resend blocked — OTP still valid');

        req.flash('error', 'OTP already sent. Please wait before requesting a new one.');
        return res.redirect('/users/auth/verify-otp');
      }

      //4: Invalidate all previous OTPs
      await verificationCodeModel.updateMany(
        {
          userId: user._id.toString(),
          verificationType: VerificationType.EMAIL_VERIFICATION,
          verificationStatus: VerificationStatus.PENDING,
        },
        {
          $set: { verificationStatus: VerificationStatus.EXPIRED },
        },
      );

      //5: Generate new OTP
      const rawOtp = authHelper.generateRandomOtp();
      if (!rawOtp) {
        Logger.warn('OTP generation failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/users/auth/login');
      }

      const hashedOtp = authHelper.hashVerificationCodeHelper(rawOtp.toString());
      if (!hashedOtp) {
        Logger.warn('OTP hashing failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/users/auth/login');
      }

      // 6: Store new OTP
      await verificationCodeModel.create({
        userId: user._id.toString(),
        verificationCode: hashedOtp,
        verificationCodeExpiration: new Date(Date.now() + VERIFICATION_CODE_EXPIRATION_TIME),
        verificationType: VerificationType.EMAIL_VERIFICATION,
        verificationStatus: VerificationStatus.PENDING,
      });

      //7 Prepare & store email
      const emailBody = emailVerificationEmailTemplate({
        OTP: rawOtp.toString(),
        USERNAME: user.username,
        EXPIRY_MINUTES: VERIFICATION_CODE_EXPIRATION_TIME / 1000 / 60,
      });

      const emailRecord = await emailModel.findOneAndUpdate(
        {
          recipient: user._id,
          recipientEmail: user.email,
        },
        {
          $set: {
            subject: 'Email Verification',
            body: emailBody,
            status: EmailStatus.PENDING,
            sendAt: new Date(),
            source: UserRole.USER,
          },
        },
        { upsert: true, new: true },
      );

      //8. Send email
      await sendEmailService({
        recipient: emailRecord.recipientEmail,
        subject: emailRecord.subject,
        htmlTemplate: emailRecord.body,
      });

      Logger.info('OTP resent successfully');

      req.flash('success', 'A new OTP has been sent to your email');
      return res.redirect('/users/auth/verify-otp');
    } catch (error) {
      Logger.warn((error as Error).message);

      req.flash('error', 'Something went wrong. Please try again.');
      return res.redirect('/users/auth/login');
    }
  }

  async getUserLoginPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user login page...');

      // Check if user already logged in
      if (req.session.user && req.session.user.isEmailVerified === true) {
        Logger.warn('User already logged in');

        req.flash('error', 'You are already logged in');
        return res.redirect('/');
      }

      return res.render('users/auth/login', {
        title: 'User | Login',
        pageTitle: 'User Login',
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/login');
    }
  }

  async userLoginHandler(req: Request, res: Response) {
    try {
      Logger.info(`User Login route called with data: ${JSON.stringify(req.body)}`);

      const ip = req.ip as string;
      const userAgent = req.headers['user-agent'] as string;
      const { email, password } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Find user by email
      const user = await userModel
        .findOne({ email: normalizedEmail, isEmailVerified: true, role: UserRole.USER })
        .select('+passwordHash');
      if (!user) {
        Logger.warn('User not found');

        await authRepo.createLoginRecord({
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        req.flash('error', 'Invalid email or password');
        return res.redirect('/users/auth/login');
      }

      // 2. Check user is blocked or disabled or deleted
      if (user.status !== UserStatus.ACTIVE) {
        Logger.warn('User not found');

        await authRepo.createLoginRecord({
          userId: user._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        req.flash('error', 'Your account is not active');
        return res.redirect('/users/auth/login');
      }

      // 3. Compare password
      const isPasswordCompareCorrect = await authHelper.comparePasswordHelper(
        password,
        user.passwordHash,
      );
      if (!isPasswordCompareCorrect) {
        Logger.warn('Password is incorrect');

        await authRepo.createLoginRecord({
          userId: user._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        req.flash('error', 'Invalid email or password');
        return res.redirect('/users/auth/login');
      }

      // 4. Generate JWT tokens
      const tokens = authHelper.signAccessTokenAndRefreshToken(user);
      if (!tokens) {
        Logger.warn('Generating JWT tokens failed');

        await authRepo.createLoginRecord({
          userId: user._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        req.flash('error', 'Error occurred while logging in please try again');
        return res.redirect('/users/auth/login');
      }

      // 5. Store refresh token in db
      const newRefreshTokenRecord = await refreshTokenModel.create({
        userId: user._id,
        tokenHash: tokens.refreshToken,
        expiresAt: REFRESH_TOKEN_EXPIRATION_TIME,
        ip,
        userAgent,
      });
      if (!newRefreshTokenRecord) {
        Logger.warn('Storing refresh token failed');

        req.flash('error', 'Error occurred while logging in please try again');
        return res.redirect('/users/auth/login');
      }

      Logger.debug('User has been logged in successfully');

      // 6. Create login record in db
      const loginRecord = await authRepo.createLoginRecord({
        userId: user._id.toString(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.SUCCESS,
      });
      if (!loginRecord) {
        Logger.warn('Storing login record failed');

        req.flash('error', 'Error occurred while logging in please try again');
        return res.redirect('/users/auth/login');
      }

      Logger.debug('User login record has been created successfully');

      // 5. Store user info in session
      req.session.user = {
        _id: user._id.toString(),
        role: user.role,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        avatarUrl: user.avatarUrl || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // 7. Send accessToken and refreshToken to client cookies
      req.flash('success', 'Logged in successfully');
      return res
        .cookie('accessToken', tokens.accessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: ACCESS_TOKEN_TTL,
        })
        .cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_TTL,
        })
        .redirect('/');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/login');
    }
  }

  async getUserForgetPasswordPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user forget password page...');

      // if (req.session.user) {
      //   Logger.warn('User already logged in');

      //   req.flash('error', 'You are already logged in');
      //   return res.redirect('/');
      // }

      return res.render('users/auth/forgot-password', {
        title: 'User | Forgot Password',
        pageTitle: 'User Forgot Password',
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/forgot-password');
    }
  }

  async userForgotPasswordHandler(req: Request, res: Response) {
    try {
      Logger.info('User forgot password request received');

      const { email } = req.body;

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Check user exist or not
      const user = await userModel.findOne({
        email: normalizedEmail,
        isEmailVerified: true,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      if (!user) {
        Logger.warn('User not found');

        req.flash('error', 'Invalid email or your account is not active');
        return res.redirect('/users/auth/forgot-password');
      }

      //2 Get latest verification code
      const latestOtp = await verificationCodeModel
        .findOne({
          userId: user._id.toString(),
          verificationType: VerificationType.PASSWORD_RESET,
        })
        .sort({ createdAt: -1 });

      const now = new Date();

      //3. If OTP exists & still valid
      if (
        latestOtp &&
        latestOtp.verificationStatus === VerificationStatus.PENDING &&
        latestOtp.verificationCodeExpiration > now
      ) {
        Logger.warn('OTP resend blocked — OTP still valid');

        req.flash('error', 'OTP already sent. Please check your email');
        return res.redirect('/users/auth/forgot-password');
      }

      //4: Invalidate all previous OTPs
      await verificationCodeModel.updateMany(
        {
          userId: user._id.toString(),
          verificationType: VerificationType.PASSWORD_RESET,
          verificationStatus: VerificationStatus.PENDING,
        },
        {
          $set: { verificationStatus: VerificationStatus.EXPIRED },
        },
      );

      //5: Generate new OTP
      const rawToken = authHelper.generateResetPasswordSecret(user);
      if (!rawToken) {
        Logger.warn('OTP generation failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/users/auth/login');
      }

      // 6.Hashed otp before storing in db
      const hashedOtp = authHelper.hashVerificationCodeHelper(rawToken);
      if (!hashedOtp) {
        Logger.warn('OTP hashing failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/users/auth/login');
      }

      // 7: Store new OTP
      await verificationCodeModel.findOneAndUpdate(
        {
          userId: user._id,
          verificationType: VerificationType.PASSWORD_RESET,
        },
        {
          $set: {
            verificationCode: hashedOtp,
            verificationCodeExpiration: new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRATION_TIME),
            verificationStatus: VerificationStatus.PENDING,
          },
        },
        {
          upsert: true,
          new: true,
        },
      );

      Logger.debug('User reset password token has been created successfully');

      // 5. Send reset password token to user email
      const resetPasswordLink = `${env.CLIENT_URL}/users/auth/reset-password?token=${rawToken}`;

      // Store Mail data in db
      const mailRecord = await emailModel.create({
        recipient: user._id,
        recipientEmail: user.email,
        subject: 'Password Reset Request',
        source: UserRole.USER,
        sendAt: new Date(),
        body: forgotPasswordEmailTemplate({
          username: user.username,
          reset_url: resetPasswordLink,
          expiry_minutes: RESET_PASSWORD_TOKEN_EXPIRATION_TIME / 60,
          year: new Date().getFullYear(),
        }),
      });
      if (!mailRecord) {
        Logger.warn('Storing mail data failed');

        req.flash('error', 'Error occurred while resetting password please try again');
        return res.redirect('/users/auth/forgot-password');
      }

      // TODO: Send reset password email
      await sendEmailService({
        recipient: user.email,
        subject: mailRecord.subject,
        htmlTemplate: mailRecord.body,
      });

      Logger.debug('Email sent for forgot password');

      req.flash('success', 'Password reset email has been sent to your email');
      res.redirect('/users/auth/forgot-password');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/forgot-password');
    }
  }

  async getUserResetPasswordPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user reset password page...');

      if (req.session.user) {
        Logger.warn('User already logged in');

        req.flash('error', 'You are already logged in');
        return res.redirect('/');
      }

      if (!req.query.token) {
        req.flash('error', 'Reset token is invalid or expired');
        return res.redirect('/users/auth/reset-password');
      }

      const tokenPayload = authHelper.verifyResetPasswordSecret(req.query.token as string);
      if (!tokenPayload?.sub) {
        req.flash('error', 'Reset token is invalid or expired');
        return res.redirect('/users/auth/reset-password');
      }

      return res.render('users/auth/reset-password', {
        title: 'User | Reset Password',
        pageTitle: 'User Reset Password',
        token: req.query.token,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/reset-password');
    }
  }

  async userResetPasswordHandler(req: Request, res: Response) {
    try {
      Logger.info('Reset user password...');

      if (req.session.user) {
        Logger.warn('User already logged in');

        req.flash('error', 'You are already logged in');
        return res.redirect('/users/profile');
      }

      const { token, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        req.flash('error', 'Password and confirm password do not match');
        return res.redirect(`/users/auth/reset-password?token=${token}`);
      }

      // 1. Verify JWT reset token
      const tokenPayload = authHelper.verifyResetPasswordSecret(token);
      if (!tokenPayload?.sub) {
        req.flash('error', 'Reset token is invalid or expired');
        return res.redirect(`/users/auth/reset-password?token=${token}`);
      }

      // One more check for user enter previous password
      const user = await userModel.findById(tokenPayload.sub);
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect(`/users/auth/reset-password?token=${token}`);
      }

      const isPasswordMatch = await authHelper.comparePasswordHelper(password, user.passwordHash);
      if (isPasswordMatch) {
        req.flash('error', 'New password cannot be same as old password');
        return res.redirect(`/users/auth/reset-password?token=${token}`);
      }

      // 2.Hash incoming token for DB comparison
      const hashedToken = authHelper.hashVerificationCodeHelper(token);

      // 3. Validate OTP record
      const otpRecord = await verificationCodeModel.findOne({
        userId: tokenPayload.sub,
        verificationType: VerificationType.PASSWORD_RESET,
        verificationCode: hashedToken,
        verificationStatus: VerificationStatus.PENDING,
        verificationCodeExpiration: { $gt: new Date() },
      });

      if (!otpRecord) {
        req.flash('error', 'Reset token is invalid or expired');
        return res.redirect(`/users/auth/reset-password?token=${token}`);
      }

      // 4. Hash new password
      const passwordHash = await authHelper.hashPasswordHelper(password);
      if (!passwordHash) {
        req.flash('error', 'Failed to process password');
        return res.redirect(`/users/auth/reset-password?token=${token}`);
      }

      // 5. Update password
      const updatedUser = await userModel.findByIdAndUpdate(
        tokenPayload.sub,
        { passwordHash },
        { new: true },
      );

      if (!updatedUser) {
        req.flash('error', 'Failed to update password');
        return res.redirect(`/users/auth/reset-password?token=${token}`);
      }

      // 6. Invalidate all sessions
      await refreshTokenModel.deleteMany({ userId: updatedUser._id });

      // 7. Mark OTP as USED
      await verificationCodeModel.updateOne(
        { _id: otpRecord._id },
        { $set: { verificationStatus: VerificationStatus.USED } },
      );

      req.flash('success', 'Password reset successfully');
      return res.redirect('/users/auth/login');
    } catch (error) {
      Logger.error((error as Error).message);

      req.flash('error', 'Something went wrong');
      return res.redirect('/users/auth/reset-password');
    }
  }
  async userLogoutHandler(req: Request, res: Response) {
    try {
      Logger.info('User logging out...');
      const userId = req.user?._id ?? req.session.user?._id;

      // 1.Validate user id
      if (!userId) {
        Logger.warn('User id not found');

        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/');
      }
      // 2. Delete refresh token
      const deletedRefreshTokenRecord = await refreshTokenModel.deleteMany({
        userId,
      });
      if (!deletedRefreshTokenRecord) {
        Logger.warn('Deleting refresh token record failed');

        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/users/profile');
      }

      // 3. Clear cookies
      req.flash('success', 'Logged out successfully');

      req.session.destroy(() => {
        res
          .clearCookie('admin_session')
          .clearCookie('refreshToken')
          .clearCookie('accessToken')
          .redirect('/users/auth/login');
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/login');
    }
  }
}

export default new UserAuthController();

import { Request, Response } from 'express';
import Logger from '@config/logger.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import { LoginStatus } from 'models/login.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import { env } from '@config/env.js';
import {
  ACCESS_TOKEN_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRATION_TIME,
  RESET_PASSWORD_TOKEN_EXPIRATION_TIME,
} from 'constants/index.js';
import forgotPasswordEmailTemplate from 'mail/templates/auth/forgotPasswordEmail.template.js';
import emailModel, { EmailSource, EmailType } from 'models/email.model.js';
import verificationCodeModel, {
  VerificationStatus,
  VerificationType,
} from 'models/verificationCode.model.js';
import { logoutCleanupQueue } from 'queues/logoutCleanup.queue.js';
import { sendEmailQueue } from 'queues/sendEmail.queue.js';
import { loginTrackerQueue } from 'queues/loginTracker.queue.js';

class AdminAuthController {
  async getAdminLoginPage(req: Request, res: Response) {
    Logger.info('Getting Admin login page...');

    return res.render('admin/auth/login', {
      title: 'Admin | Login',
      pageTitle: 'Admin Login',
    });
  }

  async getAdminForgetPasswordPage(req: Request, res: Response) {
    Logger.info('Getting Admin forget password page...');

    return res.render('admin/auth/forgot-password', {
      title: 'Admin | Forgot Password',
      pageTitle: 'Admin Forgot Password',
    });
  }

  async getAdminResetPasswordPage(req: Request, res: Response) {
    Logger.info('Getting Admin reset password page...');

    return res.render('admin/auth/reset-password', {
      title: 'Admin | Reset Password',
      pageTitle: 'Admin Reset Password',
      token: req.query.token,
    });
  }

  async getAdminResendVerificationPage(req: Request, res: Response) {
    Logger.info('Getting Admin resend verification page...');

    return res.render('admin/auth/resend-verification', {
      title: 'Admin | Resend Verification',
      pageTitle: 'Admin Resend Verification',
      userId: req.query.userId,
    });
  }

  async adminLoginHandler(req: Request, res: Response) {
    try {
      Logger.info(`Admin Login route called with data: ${JSON.stringify(req.body)}`);

      const ip = req.ip as string;
      const userAgent = req.headers['user-agent'] as string;
      const { email, password } = req.body;

      const normalizedEmail = email.trim().toLowerCase();

      //Find user by email
      const admin = await userModel
        .findOne({ email: normalizedEmail, isEmailVerified: true, role: UserRole.ADMIN })
        .select('+passwordHash');

      if (!admin) {
        await loginTrackerQueue.add('login-tracker', {
          userId: 'GUEST',
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        throw new Error('Invalid email or password');
      }

      //Check user is blocked or disabled or deleted
      if (admin.status !== UserStatus.ACTIVE) {
        await loginTrackerQueue.add('login-tracker', {
          userId: admin._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        throw new Error('Your account is not active');
      }

      //Compare password
      const isPasswordCompareCorrect = await authHelper.comparePasswordHelper(
        password,
        admin.passwordHash,
      );
      if (!isPasswordCompareCorrect) {
        await loginTrackerQueue.add('login-tracker', {
          userId: admin._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        throw new Error('Invalid email or password');
      }

      //Generate JWT tokens
      const tokens = authHelper.signAccessTokenAndRefreshToken(admin);
      if (!tokens) {
        Logger.warn('Generating JWT tokens failed');
        await loginTrackerQueue.add('login-tracker', {
          userId: admin._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        throw new Error('Error occurred while logging in please try again');
      }

      // Store refresh token in db
      const newRefreshTokenRecord = await refreshTokenModel.create({
        userId: admin._id,
        tokenHash: tokens.refreshToken,
        expiresAt: REFRESH_TOKEN_EXPIRATION_TIME,
        ip,
        userAgent,
      });
      if (!newRefreshTokenRecord) {
        Logger.warn('Storing refresh token failed');
        throw new Error('Error occurred while logging in please try again');
      }

      Logger.debug('Admin has been logged in successfully');

      await loginTrackerQueue.add('login-tracker', {
        userId: admin._id.toString(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.SUCCESS,
        lastLoginAt: new Date(),
      });

      //Send accessToken and refreshToken to client cookies
      req.flash('success', 'Logged in successfully');
      return res
        .cookie('accessToken', tokens.accessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: ACCESS_TOKEN_EXPIRATION_TIME,
        })
        .cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_EXPIRATION_TIME,
        })
        .redirect('/admins/dashboard');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/auth/login');
    }
  }

  async adminForgotPasswordHandler(req: Request, res: Response) {
    try {
      Logger.info('Admin forgot password request received');

      const { email } = req.body;

      const normalizedEmail = email.trim().toLowerCase();

      //Check user exist or not
      const admin = await userModel.findOne({
        email: normalizedEmail,
        isEmailVerified: true,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      if (!admin) {
        throw new Error('Please register first');
      }

      // Get latest verification code
      const latestOtp = await verificationCodeModel
        .findOne({
          userId: admin._id.toString(),
          verificationType: VerificationType.PASSWORD_RESET,
        })
        .sort({ createdAt: -1 });

      const now = new Date();

      // If OTP exists & still valid
      if (
        latestOtp &&
        latestOtp.verificationStatus === VerificationStatus.PENDING &&
        latestOtp.verificationCodeExpiration > now
      ) {
        throw new Error('OTP already sent. Please check your email');
      }

      //Invalidate all previous OTPs
      await verificationCodeModel.updateMany(
        {
          userId: admin._id.toString(),
          verificationType: VerificationType.PASSWORD_RESET,
          verificationStatus: VerificationStatus.PENDING,
        },
        {
          $set: { verificationStatus: VerificationStatus.EXPIRED },
        },
      );

      // Generate new OTP
      const rawToken = authHelper.generateResetPasswordSecret(admin);
      if (!rawToken) {
        Logger.warn('OTP generation failed');
        throw new Error('Something went wrong please try again');
      }

      // Hashed otp before storing in db
      const hashedOtp = authHelper.hashVerificationCodeHelper(rawToken);
      if (!hashedOtp) {
        Logger.warn('OTP hashing failed');
        throw new Error('Something went wrong please try again');
      }

      //Store new OTP
      await verificationCodeModel.findOneAndUpdate(
        {
          userId: admin._id,
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

      Logger.debug('Admin reset password token has been created successfully');

      // Send reset password token to user email
      const resetPasswordLink = `${env.CLIENT_URL}/admins/auth/reset-password?token=${rawToken}`;

      // Store Mail data in db
      const mailRecord = await emailModel.create({
        recipient: admin?._id,
        recipientEmail: admin?.email,
        subject: 'Password Reset Request',
        type: EmailType.PASSWORD_RESET,
        source: EmailSource.SYSTEM,
        sendAt: new Date(),
        body: forgotPasswordEmailTemplate({
          username: admin?.username,
          reset_url: resetPasswordLink,
          expiry_minutes: RESET_PASSWORD_TOKEN_EXPIRATION_TIME / 1000 / 60,
          year: new Date().getFullYear(),
        }),
      });

      await sendEmailQueue.add('send-email', {
        emailId: mailRecord._id.toString(),
      });

      req.flash('success', 'Password reset email has been sent to your email');
      res.redirect(`/admins/auth/resend-verification?userId=${admin._id.toString()}`);
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/auth/forgot-password');
    }
  }

  async adminResendOtpHandler(req: Request, res: Response) {
    const { userId } = req.body;

    try {
      Logger.info('Resending Admin OTP...');

      const admin = await userModel.findOne({
        _id: userId,
        role: UserRole.ADMIN,
      });

      if (!admin) {
        throw new Error(
          'Your account is not eligible for OTP verification, please contact support',
        );
      }

      const latestOtp = await verificationCodeModel
        .findOne({
          userId: admin._id.toString(),
          verificationType: VerificationType.PASSWORD_RESET,
        })
        .sort({ createdAt: -1 });

      const now = new Date();

      if (
        latestOtp &&
        latestOtp.verificationStatus === VerificationStatus.PENDING &&
        latestOtp.verificationCodeExpiration > now
      ) {
        throw new Error('OTP already sent. Please wait before requesting a new one.');
      }

      await verificationCodeModel.updateMany(
        {
          userId: admin._id.toString(),
          verificationType: VerificationType.PASSWORD_RESET,
          verificationStatus: VerificationStatus.PENDING,
        },
        { $set: { verificationStatus: VerificationStatus.EXPIRED } },
      );

      const rawToken = authHelper.generateResetPasswordSecret(admin);
      const hashedOtp = authHelper.hashVerificationCodeHelper(rawToken as string);

      await verificationCodeModel.findOneAndUpdate(
        { userId: admin._id, verificationType: VerificationType.PASSWORD_RESET },
        {
          $set: {
            verificationCode: hashedOtp,
            verificationCodeExpiration: new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRATION_TIME),
            verificationStatus: VerificationStatus.PENDING,
          },
        },
        { upsert: true, new: true },
      );

      const resetPasswordLink = `${env.CLIENT_URL}/admins/auth/reset-password?token=${rawToken}`;

      const mailRecord = await emailModel.create({
        recipient: admin._id,
        recipientEmail: admin.email,
        subject: 'Password Reset Request',
        type: EmailType.PASSWORD_RESET,
        source: EmailSource.SYSTEM,
        sendAt: new Date(),
        body: forgotPasswordEmailTemplate({
          username: admin.username,
          reset_url: resetPasswordLink,
          expiry_minutes: RESET_PASSWORD_TOKEN_EXPIRATION_TIME / 1000 / 60,
          year: new Date().getFullYear(),
        }),
      });

      await sendEmailQueue.add('send-email', {
        emailId: mailRecord._id.toString(),
      });

      req.flash('success', 'A new OTP has been sent to your email');
      return res.redirect(`/admins/auth/resend-verification?userId=${admin._id.toString()}`);
    } catch (error) {
      Logger.warn((error as Error).message);

      req.flash('error', (error as Error).message);
      return res.redirect(`/admins/auth/resend-verification?userId=${userId}`);
    }
  }

  async adminResetPasswordHandler(req: Request, res: Response) {
    const { token, password, confirmPassword } = req.body;

    try {
      Logger.info('Admin reset password request received');

      if (password !== confirmPassword) {
        throw new Error('Password and confirm password are not same');
      }

      const hashedToken = authHelper.hashVerificationCodeHelper(token);

      const otpRecord = await verificationCodeModel.findOne({
        verificationCode: hashedToken,
        verificationType: VerificationType.PASSWORD_RESET,
        verificationStatus: VerificationStatus.PENDING,
        verificationCodeExpiration: { $gt: new Date() },
      });

      if (!otpRecord) {
        throw new Error('OTP is invalid or expired');
      }

      const tokenPayload = authHelper.verifyResetPasswordSecret(token);
      if (!tokenPayload?.sub) {
        throw new Error('Reset token is invalid or expired');
      }

      const user = await userModel.findById(tokenPayload.sub).select('+passwordHash');

      if (!user || user.role !== UserRole.ADMIN) {
        throw new Error('Unauthorized password reset attempt');
      }

      const isPasswordMatch = await authHelper.comparePasswordHelper(password, user.passwordHash);

      if (isPasswordMatch) {
        throw new Error('New password cannot be same as old password');
      }

      const passwordHash = await authHelper.hashPasswordHelper(password);

      const updatedUser = await userModel.findByIdAndUpdate(
        user._id,
        { passwordHash },
        { new: true },
      );

      await Promise.all([
        refreshTokenModel.deleteMany({ userId: updatedUser?._id }),
        verificationCodeModel.updateMany(
          {
            userId: updatedUser?._id,
            verificationType: VerificationType.PASSWORD_RESET,
          },
          { $set: { verificationStatus: VerificationStatus.USED } },
        ),
      ]);

      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');

      req.flash('success', 'Password reset successfully');
      return res.redirect('/admins/auth/login');
    } catch (error) {
      Logger.error((error as Error).message);

      req.flash('error', (error as Error).message);
      req.flash('resetToken', token);
      return res.redirect(`/admins/auth/reset-password?token=${token}`);
    }
  }

  async adminLogoutHandler(req: Request, res: Response) {
    try {
      Logger.info('User logging out...');
      const userId = req?.user?._id;
      if (!userId) {
        return res.redirect('/admins/auth/login');
      }

      // TODO: BULL MQ JOB FOR DELETING REFRESH TOKEN, EMAILS, VERIFICATION CODES
      await logoutCleanupQueue.add('cleanup-auth-data', {
        userId: userId.toString(),
      });

      req.flash('success', 'Logged out successfully');

      //Clear cookies
      return res
        .clearCookie('refreshToken')
        .clearCookie('accessToken')
        .redirect('/admins/auth/login');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admins/auth/login');
    }
  }
}

export default new AdminAuthController();

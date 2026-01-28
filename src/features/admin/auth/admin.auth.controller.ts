import { Request, Response } from 'express';
import Logger from '@config/logger.js';
import {
  TUserForgotPasswordDTO,
  TUserLoginDTO,
  TUserResetPasswordDTO,
  TUserResetPasswordQueryDTO,
} from 'features/user/auth/user.auth.validation.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import authRepo from '@modules/auth/auth.repo.js';
import { LoginStatus } from 'models/login.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import { env } from '@config/env.js';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from '@modules/auth/auth.constants.js';
import {
  REFRESH_TOKEN_EXPIRATION_TIME,
  RESET_PASSWORD_TOKEN_EXPIRATION_TIME,
} from 'constants/index.js';
import verificationCodeModel, {
  VerificationStatus,
  VerificationType,
} from 'models/verificationCode.model.js';
import emailModel from 'models/email.model.js';
import forgotPasswordEmailTemplate from 'mail/templates/auth/forgotPasswordEmail.template.js';
import { sendEmailService } from 'mail/index.js';

class AdminAuthController {
  async renderAdminLoginPage(req: Request, res: Response) {
    try {
      Logger.info('Getting admin login page...');

      return res.render('admin/auth/login', {
        title: 'Admin | Login',
        pageTitle: 'Admin Login',
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/auth/register');
    }
  }

  async adminLoginHandler(req: Request<object, object, TUserLoginDTO>, res: Response) {
    try {
      Logger.info(`Admin Login route called with data: ${JSON.stringify(req.body)}`);

      const ip = req.ip as string;
      const userAgent = req.headers['user-agent'] as string;
      const { email, password } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Find user by email
      const admin = await userModel
        .findOne({ email: normalizedEmail, isEmailVerified: true, role: UserRole.ADMIN })
        .select('+passwordHash');
      if (!admin) {
        Logger.warn(`Admin not found with email: ${normalizedEmail}`);

        await authRepo.createLoginRecord({
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        req.flash('error', 'Invalid email or password');
        return res.redirect('/admin/auth/login');
      }

      // 2. Check user is blocked or disabled or deleted
      if (admin.status !== UserStatus.ACTIVE) {
        Logger.warn(`Admin status is not active with email: ${normalizedEmail}`);

        await authRepo.createLoginRecord({
          userId: admin._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        req.flash('error', 'Your account is not active');
        return res.redirect('/admin/auth/login');
      }

      // 3. Compare password
      const isPasswordCompareCorrect = await authHelper.comparePasswordHelper(
        password,
        admin.passwordHash,
      );
      if (!isPasswordCompareCorrect) {
        Logger.warn('Password is incorrect');

        await authRepo.createLoginRecord({
          userId: admin._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        req.flash('error', 'Invalid email or password');
        return res.redirect('/admin/auth/login');
      }

      // 4. Generate JWT tokens
      const tokens = authHelper.signAccessTokenAndRefreshToken(admin);
      if (!tokens) {
        Logger.warn('Generating JWT tokens failed');

        await authRepo.createLoginRecord({
          userId: admin._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        req.flash('error', 'Error occurred while logging in please try again');
        return res.redirect('/admin/auth/login');
      }

      // 5. Store refresh token in db
      const newRefreshTokenRecord = await refreshTokenModel.create({
        userId: admin._id,
        tokenHash: tokens.refreshToken,
        expiresAt: REFRESH_TOKEN_EXPIRATION_TIME,
        ip,
        userAgent,
      });
      if (!newRefreshTokenRecord) {
        Logger.warn('Storing refresh token failed');

        req.flash('error', 'Error occurred while logging in please try again');
        return res.redirect('/admin/auth/login');
      }

      Logger.info('User has been logged in successfully');

      // 6. Create login record in db
      const loginRecord = await authRepo.createLoginRecord({
        userId: admin._id.toString(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.SUCCESS,
      });
      if (!loginRecord) {
        Logger.warn('Storing login record failed');

        req.flash('error', 'Error occurred while logging in please try again');
        return res.redirect('/admin/auth/login');
      }

      Logger.info('Admin login record has been created successfully');

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
        .redirect('/admin/dashboard');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/auth/forgot-password');
    }
  }

  async renderUserForgetPasswordPage(req: Request, res: Response) {
    try {
      Logger.info('Getting admin forget password page...');

      return res.render('admin/auth/forgot-password', {
        title: 'Admin | Forgot Password',
        pageTitle: 'Admin Forgot Password',
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/auth/forgot-password');
    }
  }

  async userForgotPasswordHandler(
    req: Request<object, object, TUserForgotPasswordDTO>,
    res: Response,
  ) {
    try {
      Logger.info('Admin forgot password request received');

      const { email } = req.body;

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Check user exist or not
      const user = await userModel.findOne({
        email: normalizedEmail,
        isEmailVerified: true,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      if (!user) {
        Logger.warn('Admin not found');

        req.flash('error', 'Invalid email or your account is not active');
        return res.redirect('/admin/auth/forgot-password');
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
        return res.redirect('/admin/auth/forgot-password');
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
        return res.redirect('/admin/auth/login');
      }

      // 6.Hashed otp before storing in db
      const hashedOtp = authHelper.hashVerificationCodeHelper(rawToken);
      if (!hashedOtp) {
        Logger.warn('OTP hashing failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/auth/login');
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

      Logger.debug('Admin reset password token has been created successfully');

      // 5. Send reset password token to user email
      const resetPasswordLink = `${env.CLIENT_URL}/admin/auth/reset-password?token=${rawToken}`;

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
        return res.redirect('/admin/auth/forgot-password');
      }

      // TODO: Send reset password email
      await sendEmailService({
        recipient: user.email,
        subject: mailRecord.subject,
        htmlTemplate: mailRecord.body,
      });

      Logger.debug('Email sent for forgot password');

      req.flash('success', 'Password reset email has been sent to your email');
      res.redirect('/admin/auth/forgot-password');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/auth/forgot-password');
    }
  }

  async renderAdminResetPasswordPage(
    req: Request<object, object, object, TUserResetPasswordQueryDTO>,
    res: Response,
  ) {
    try {
      Logger.info('Getting user reset password page...');

      return res.render('admin/auth/reset-password', {
        title: 'Admin | Reset Password',
        pageTitle: 'Admin Reset Password',
        token: req.query.token,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/reset-password');
    }
  }

  async adminResetPasswordHandler(
    req: Request<object, object, TUserResetPasswordDTO>,
    res: Response,
  ) {
    try {
      const { token, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        req.flash('error', 'Password and confirm password do not match');
        return res.redirect(`/admin/auth/reset-password?token=${token}`);
      }

      // 1. Verify JWT reset token
      const tokenPayload = authHelper.verifyResetPasswordSecret(token);
      if (!tokenPayload?.sub) {
        req.flash('error', 'Reset token is invalid or expired');
        return res.redirect(`/admin/auth/reset-password?token=${token}`);
      }

      // One more check for user enter previous password
      const user = await userModel.findById(tokenPayload.sub);
      if (!user) {
        req.flash('error', 'User not found');
        return res.redirect(`/admin/auth/reset-password?token=${token}`);
      }

      const isPasswordMatch = await authHelper.comparePasswordHelper(password, user.passwordHash);
      if (isPasswordMatch) {
        req.flash('error', 'New password cannot be same as old password');
        return res.redirect(`/admin/auth/reset-password?token=${token}`);
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
        return res.redirect(`/admin/auth/reset-password?token=${token}`);
      }

      // 4. Hash new password
      const passwordHash = await authHelper.hashPasswordHelper(password);
      if (!passwordHash) {
        req.flash('error', 'Failed to process password');
        return res.redirect(`/admin/auth/reset-password?token=${token}`);
      }

      // 5. Update password
      const updatedUser = await userModel.findByIdAndUpdate(
        tokenPayload.sub,
        { passwordHash },
        { new: true },
      );

      if (!updatedUser) {
        req.flash('error', 'Failed to update password');
        return res.redirect(`/admin/auth/reset-password?token=${token}`);
      }

      // 6. Invalidate all sessions
      await refreshTokenModel.deleteMany({ userId: updatedUser._id });

      // 7. Mark OTP as USED
      await verificationCodeModel.updateOne(
        { _id: otpRecord._id },
        { $set: { verificationStatus: VerificationStatus.USED } },
      );

      req.flash('success', 'Password reset successfully');
      return res.redirect('/admin/auth/login');
    } catch (error) {
      Logger.error((error as Error).message);

      req.flash('error', 'Something went wrong');
      return res.redirect('/admin/auth/reset-password');
    }
  }

  async adminLogoutHandler(req: Request, res: Response) {
    try {
      Logger.info('User logging out...');
      const userId = req.user?._id || req.session.user?.userId;

      // 1.Validate user id
      if (!userId) {
        Logger.warn('User id not found');

        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/admin/profile');
      }
      // 2. Delete refresh token
      const deletedRefreshTokenRecord = await refreshTokenModel.deleteMany({
        userId,
      });
      if (!deletedRefreshTokenRecord) {
        Logger.warn('Deleting refresh token record failed');

        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/admin/profile');
      }

      // 3. Clear cookies
      req.flash('success', 'Logged out successfully');
      return res
        .clearCookie('refreshToken')
        .clearCookie('accessToken')
        .redirect('/admin/auth/login');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/auth/login');
    }
  }
}

export default new AdminAuthController();

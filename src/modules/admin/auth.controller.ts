import type { Request, Response } from 'express';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import { LoginStatus } from 'models/login.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import authRepo from '@modules/auth/auth.repo.js';
import { env } from '@config/env.js';
import Logger from '@config/logger.js';
import { sendEmailService } from 'mail/index.js';
import forgotPasswordEmailTemplate from 'mail/templates/auth/forgotPasswordEmail.template.js';
import {
  ACCESS_TOKEN_TTL,
  FORGOT_PASSWORD_EXPIRY_MINUTES,
  REFRESH_TOKEN_TTL,
} from '@modules/auth/auth.constants.js';
import { IAuthUserShape } from '@modules/auth/auth.types.js';
class AdminAuthController {
  async getAdminLoginPage(req: Request, res: Response) {
    try {
      return res.render('admin/auth/login', {
        title: 'Admin| Login',
        pageTitle: 'Admin Login',
      });
    } catch (error) {
      req.flash('error', (error as Error).message);
    }
  }

  async getAdminForgotPasswordPage(req: Request, res: Response) {
    try {
      return res.render('admin/auth/forgot-password', {
        title: 'Admin | Forgot Password',
        pageTitle: 'Admin Forgot Password',
      });
    } catch (error) {
      req.flash('error', (error as Error).message);
    }
  }

  async getAdminResetPasswordPage(req: Request, res: Response) {
    try {
      return res.render('admin/auth/reset-password', {
        title: 'Admin | Reset Password',
        pageTitle: 'Admin Reset Password',
        token: req.query.token,
      });
    } catch (error) {
      req.flash('error', (error as Error).message);
    }
  }

  async forgotPasswordHandler(req: Request, res: Response) {
    Logger.debug(`Forgot password ...`);

    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const admin = await userModel.findOne({
      email: normalizedEmail,
      role: UserRole.ADMIN,
    });

    if (!admin) {
      Logger.error('User not found');
      req.flash('error', 'User not found');
      return res.redirect('/admin/auth/forgot-password');
    }

    // Check user email is verified or not
    if (!admin.isEmailVerified) {
      Logger.error('Email not verified');
      req.flash('error', 'Email is not verified');
      return res.redirect('/admin/auth/forgot-password');
    }

    // Check user is blocked or disabled or deleted
    if (admin.status !== UserStatus.ACTIVE) {
      Logger.error('User is blocked or disabled or deleted');
      req.flash('error', 'User is blocked or disabled or deleted');
      return res.redirect('/admin/auth/forgot-password');
    }

    // Generate reset password token
    const resetPasswordToken = authHelper.generateResetPasswordSecret(admin);
    if (!resetPasswordToken) {
      Logger.error('Generating reset password token failed');
      req.flash('error', 'Generating reset password token failed');
      return res.redirect('/admin/auth/forgot-password');
    }

    // Generate reset password url
    const reset_url = `${env.BASE_URL}/admin/auth/reset-password?token=${resetPasswordToken}`;

    // Send email for forgot password
    await sendEmailService({
      recipient: admin.email,
      subject: 'Forgot Password',
      htmlTemplate: forgotPasswordEmailTemplate({
        username: admin.username,
        reset_url,
        expiry_minutes: FORGOT_PASSWORD_EXPIRY_MINUTES / 100000,
        year: new Date().getFullYear(),
      }),
    });

    Logger.debug('Email sent for forgot password');
    req.flash('success', 'Password reset email has been sent to your email');
    res.redirect('/admin/auth/forgot-password');
  }

  async resetPasswordHandler(req: Request, res: Response) {
    Logger.debug('Reset password ...');

    const { token, password, confirmPassword } = req.body;

    if (!token) {
      Logger.error('Reset password token is required');
      req.flash('error', 'Reset password token is required');
      return res.redirect('/admin/auth/reset-password');
    }

    // Verify reset password token
    const tokenPayload = authHelper.verifyResetPasswordSecret(token);
    if (!tokenPayload?.sub) {
      Logger.error('Reset password token is invalid or expired');
      req.flash('error', 'Reset password token is invalid or expired');
      return res.redirect('/admin/auth/reset-password');
    }

    // Check password match
    if (password !== confirmPassword) {
      Logger.error('Password and confirm password are not same');
      req.flash('error', 'Password and confirm password are not same');
      return res.redirect('/admin/auth/reset-password');
    }

    // Hash password
    const passwordHash = await authHelper.hashPasswordHelper(password);
    if (!passwordHash) {
      Logger.error('Hashing password failed');
      req.flash('error', 'Hashing password failed');
      return res.redirect('/admin/auth/reset-password');
    }

    // Update user password
    const updated = await userModel.findByIdAndUpdate(
      tokenPayload.sub.toString(),
      { passwordHash },
      { new: true },
    );

    if (!updated) {
      Logger.error('Updating user password failed');
      req.flash('error', 'Updating user password failed');
      return res.redirect('/admin/auth/reset-password');
    }

    // Delete refresh token
    // const deletedRefreshToken = await refreshTokenModel.findOneAndDelete({
    //   userId: updated._id.toString(),
    // });

    // if (!deletedRefreshToken) {
    //   Logger.error('Deleting refresh token record failed');
    //   req.flash('error', 'Deleting refresh token record failed');
    //   return res.redirect('/admin/auth/reset-password');
    // }

    Logger.info('Password reset successfully');
    req.flash('success', 'Password reset successfully');
    return res.redirect('/admin/auth/login');
  }

  async adminLoginHandler(req: Request, res: Response) {
    try {
      Logger.debug('Logging in...');

      const { email, password } = req.body;
      const { ip, userAgent } = authHelper.getClientMeta(req);

      const normalizedEmail = email.trim().toLowerCase();

      // If user exits in DB
      const admin = await userModel
        .findOne({ email: normalizedEmail, role: UserRole.ADMIN })
        .select('+passwordHash');

      if (!admin) {
        Logger.error('Admin not found');
        await authRepo.createLoginRecord({
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        req.flash('error', 'Incorrect email or password');
        return res.redirect('/admin/auth/login');
      }

      // Check user email is verified or not
      if (!admin.isEmailVerified) {
        Logger.error('Email not verified');
        await authRepo.createLoginRecord({
          userId: admin?._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        req.flash('error', 'Email is not verified');
        return res.redirect('/admin/auth/login');
      }

      // If user is blocked or disabled or deleted
      if (admin.status !== UserStatus.ACTIVE) {
        Logger.error('User is blocked or disabled or deleted');
        await authRepo.createLoginRecord({
          userId: admin?._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        req.flash('error', 'User is blocked or disabled or deleted');
        return res.redirect('/admin/auth/login');
      }

      // Compare password
      const isPasswordCorrect = await authHelper.comparePasswordHelper(
        password,
        admin.passwordHash,
      );
      if (!isPasswordCorrect) {
        Logger.error('Incorrect password');
        await authRepo.createLoginRecord({
          userId: admin?._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        req.flash('error', 'Incorrect email or password');
        return res.redirect('/admin/auth/login');
      }

      // Store user ip and user agent in login db
      const storeLoggedInRecord = await authRepo.createLoginRecord({
        userId: admin._id.toString(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.SUCCESS,
      });
      if (!storeLoggedInRecord) {
        Logger.error('Storing login record failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/auth/login');
      }

      // Generate tokens
      const tokens = authHelper.signAccessTokenAndRefreshToken(admin);

      if (!tokens) {
        Logger.error('Generating access token or refresh token failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/auth/login');
      }

      // Store refreshToken in db
      const storeRefreshTokenRecord = await authRepo.createRefreshTokenRecord({
        userId: admin._id.toString(),
        tokenHash: tokens.refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        ip,
        userAgent,
      });

      if (!storeRefreshTokenRecord) {
        Logger.error('Storing refresh token record failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/auth/login');
      }

      req.flash('success', 'Login successful');

      // Set cookies
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
      req.flash('error', (error as Error).message);
      return res.redirect('/admin/auth/login');
    }
  }

  async adminLogoutHandler(req: Request, res: Response) {
    try {
      Logger.debug('Logging out...');
      const { userId } = req.user as IAuthUserShape;

      // revoked and delete refresh token
      const deletedRefreshTokenRecord = await refreshTokenModel.findOneAndDelete({
        userId,
      });

      if (!deletedRefreshTokenRecord) {
        Logger.error('Deleting refresh token record failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/auth/login');
      }

      req.flash('success', 'Logged out successfully');
      return res.redirect('/admin/auth/login');
    } catch (error) {
      req.flash('error', (error as Error).message);
      return res.redirect('/admin/auth/login');
    }
  }
}

export default new AdminAuthController();

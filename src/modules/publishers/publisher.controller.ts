import type { Request, Response } from 'express';
import authHelper from '@modules/auth/auth.helper.js';
import authRepo from '@modules/auth/auth.repo.js';
import { LoginStatus } from 'models/login.model.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import { sendEmailService } from 'mail/index.js';
import forgotPasswordEmailTemplate from 'mail/templates/auth/forgotPasswordEmail.template.js';
import { env } from '@config/env.js';
import Logger from '@config/logger.js';
import {
  ACCESS_TOKEN_TTL,
  FORGOT_PASSWORD_EXPIRY_MINUTES,
  REFRESH_TOKEN_TTL,
} from '@modules/auth/auth.constants.js';
import { IAuthUserShape } from '@modules/auth/auth.types.js';

class PublisherController {
  /**
   * Renders the publisher login page.
   * @param {Request} req - The incoming request.
   * @param {Response} res - The outgoing response.
   * @returns {Promise<Response>} - A promise that resolves with the rendered login page.
   */
  async getPublisherLoginPage(req: Request, res: Response) {
    try {
      Logger.info('Getting publisher login page...');

      return res.render('publishers/auth/login', {
        title: 'Publisher | Login',
        pageTitle: 'Publisher Login',
      });
    } catch (error) {
      req.flash('error', (error as Error).message);
    }
  }

  /**
   * Handles the login functionality for publishers.
   * @param {Request} req - The incoming request.
   * @param {Response} res - The outgoing response.
   * @returns {Promise<Response>} - A promise that resolves with the rendered login page or redirects to the login page with an error message.
   */
  async publisherLoginHandler(req: Request, res: Response) {
    try {
      Logger.info('Publisher login route called...');

      const { email, password } = req.body;
      const { ip, userAgent } = authHelper.getClientMeta(req);

      const normalizedEmail = email.trim().toLowerCase();

      // If user exits in DB
      const publisher = await userModel
        .findOne({ email: normalizedEmail, role: UserRole.PUBLISHER })
        .select('+passwordHash');

      if (!publisher) {
        Logger.error('Publisher not found');
        await authRepo.createLoginRecord({
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        req.flash('error', 'Incorrect email or password');
        return res.redirect('/publishers/auth/login');
      }

      // Check user email is verified or not
      if (!publisher.isEmailVerified) {
        Logger.error('Email not verified');
        await authRepo.createLoginRecord({
          userId: publisher?._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        req.flash('error', 'Email is not verified');
        return res.redirect('/publishers/auth/login');
      }

      // If user is blocked or disabled or deleted
      if (publisher.status !== UserStatus.ACTIVE) {
        Logger.error('User is blocked or disabled or deleted');
        await authRepo.createLoginRecord({
          userId: publisher?._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        req.flash('error', 'User is blocked or disabled or deleted');
        return res.redirect('/publishers/auth/login');
      }

      // Compare password
      const isPasswordCorrect = await authHelper.comparePasswordHelper(
        password,
        publisher.passwordHash,
      );
      if (!isPasswordCorrect) {
        Logger.error('Incorrect password');
        await authRepo.createLoginRecord({
          userId: publisher?._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        req.flash('error', 'Incorrect email or password');
        return res.redirect('/publishers/auth/login');
      }

      // Store user ip and user agent in login db
      const storeLoggedInRecord = await authRepo.createLoginRecord({
        userId: publisher._id.toString(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.SUCCESS,
      });
      if (!storeLoggedInRecord) {
        Logger.error('Storing login record failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/auth/login');
      }

      // Generate tokens
      const tokens = authHelper.signAccessTokenAndRefreshToken(publisher);

      if (!tokens) {
        Logger.error('Generating access token or refresh token failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/auth/login');
      }

      // Store refreshToken in db
      const storeRefreshTokenRecord = await authRepo.createRefreshTokenRecord({
        userId: publisher._id.toString(),
        tokenHash: tokens.refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        ip,
        userAgent,
      });

      if (!storeRefreshTokenRecord) {
        Logger.error('Storing refresh token record failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/auth/login');
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
        .redirect('/publishers/dashboard');
    } catch (error) {
      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/auth/login');
    }
  }

  /**
   * Renders the publisher forgot password page.
   * @param {Request} req - The incoming request.
   * @param {Response} res - The outgoing response.
   * @returns {Promise<Response>} - A promise that resolves with the rendered forgot password page.
   */
  async getPublisherForgotPasswordPage(req: Request, res: Response) {
    try {
      Logger.info('Publisher get forgot password route called...');

      return res.render('publishers/auth/forgot-password', {
        title: 'Publisher | Forgot Password',
        pageTitle: 'Publisher Forgot Password',
      });
    } catch (error) {
      req.flash('error', (error as Error).message);
    }
  }

  /**
   * Handles the forgot password functionality for publishers.
   * @param {Request} req - The incoming request.
   * @param {Response} res - The outgoing response.
   * @returns {Promise<Response>} - A promise that resolves with the rendered forgot password page or redirects to the forgot password page with an error message.
   */
  async publisherForgotPasswordHandler(req: Request, res: Response) {
    Logger.info(`Publisher forgot password handler...`);

    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const publisher = await userModel.findOne({
      email: normalizedEmail,
      role: UserRole.PUBLISHER,
    });

    if (!publisher) {
      Logger.error('User not found');
      req.flash('error', 'User not found');
      return res.redirect('/publishers/auth/forgot-password');
    }

    // Check user email is verified or not
    if (!publisher.isEmailVerified) {
      Logger.error('Email not verified');
      req.flash('error', 'Email is not verified');
      return res.redirect('/publishers/auth/forgot-password');
    }

    // Check user is blocked or disabled or deleted
    if (publisher.status !== UserStatus.ACTIVE) {
      Logger.error('User is blocked or disabled or deleted');
      req.flash('error', 'User is blocked or disabled or deleted');
      return res.redirect('/publishers/auth/forgot-password');
    }

    // Generate reset password token
    const resetPasswordToken = authHelper.generateResetPasswordSecret(publisher);
    if (!resetPasswordToken) {
      Logger.error('Generating reset password token failed');
      req.flash('error', 'Generating reset password token failed');
      return res.redirect('/publishers/auth/forgot-password');
    }

    // Generate reset password url
    const reset_url = `${env.BASE_URL}/publishers/auth/reset-password?token=${resetPasswordToken}`;

    // Send email for forgot password
    await sendEmailService({
      recipient: publisher.email,
      subject: 'Forgot Password',
      htmlTemplate: forgotPasswordEmailTemplate({
        username: publisher.username,
        reset_url,
        expiry_minutes: FORGOT_PASSWORD_EXPIRY_MINUTES / 100000,
        year: new Date().getFullYear(),
      }),
    });

    Logger.debug('Email sent for forgot password');

    req.flash('success', 'Password reset email has been sent to your email');
    res.redirect('/publishers/auth/forgot-password');
  }

  /**
   * Renders the publisher reset password page.
   * @param {Request} req - The incoming request.
   * @param {Response} res - The outgoing response.
   * @returns {Promise<Response>} - A promise that resolves with the rendered reset password page or redirects to the forgot password page with an error message.
   */
  async getPublisherResetPasswordPage(req: Request, res: Response) {
    try {
      Logger.info('Getting publisher reset password page...');

      return res.render('publishers/auth/reset-password', {
        title: 'Publisher | Reset Password',
        pageTitle: 'Publisher Reset Password',
        token: req.query.token,
      });
    } catch (error) {
      req.flash('error', (error as Error).message);
    }
  }

  /**
   * Handles the reset password functionality for publishers.
   * @param {Request} req - The incoming request.
   * @param {Response} res - The outgoing response.
   * @returns {Promise<Response>} - A promise that resolves with the rendered reset password page or redirects to the forgot password page with an error message.
   */
  async publisherResetPasswordHandler(req: Request, res: Response) {
    try {
      Logger.info(`Publisher reset password handler...`);

      const { token, password, confirmPassword } = req.body;

      if (!token) {
        Logger.error('Reset password token is required');
        req.flash('error', 'Reset password token is required');
        return res.redirect('/publishers/auth/reset-password');
      }

      // Verify reset password token
      const tokenPayload = authHelper.verifyResetPasswordSecret(token);
      if (!tokenPayload?.sub) {
        Logger.error('Reset password token is invalid or expired');
        req.flash('error', 'Reset password token is invalid or expired');
        return res.redirect('/publishers/auth/reset-password');
      }

      // Check password match
      if (password !== confirmPassword) {
        Logger.error('Password and confirm password are not same');
        req.flash('error', 'Password and confirm password are not same');
        return res.redirect('/publishers/auth/reset-password');
      }

      // Hash password
      const passwordHash = await authHelper.hashPasswordHelper(password);
      if (!passwordHash) {
        Logger.error('Hashing password failed');
        req.flash('error', 'Hashing password failed');
        return res.redirect('/publishers/auth/reset-password');
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
        return res.redirect('/publishers/auth/reset-password');
      }

      // Delete refresh token
      // const deletedRefreshToken = await refreshTokenModel.findOneAndDelete({
      //   userId: updated._id.toString(),
      // });

      // if (!deletedRefreshToken) {
      //   Logger.error('Deleting refresh token record failed');
      //   req.flash('error', 'Deleting refresh token record failed');
      //   return res.redirect('/publishers/auth/reset-password');
      // }

      Logger.info('Password reset successfully');
      req.flash('success', 'Password reset successfully');
      return res.redirect('/publishers/auth/login');
    } catch (error) {
      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/auth/reset-password');
    }
  }

  /**
   * Logs out a publisher.
   *
   * @function publisherLogoutHandler
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @returns {Promise<Response>}
   */
  async publisherLogoutHandler(req: Request, res: Response) {
    try {
      Logger.info('Publisher Logging out...');

      const { userId } = req.user as IAuthUserShape;

      // revoked and delete refresh token
      const deletedRefreshTokenRecord = await refreshTokenModel.findOneAndDelete({
        userId,
      });

      if (!deletedRefreshTokenRecord) {
        Logger.error('Deleting refresh token record failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/auth/login');
      }

      req.flash('success', 'Logged out successfully');
      return res.redirect('/publishers/auth/login');
    } catch (error) {
      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/auth/login');
    }
  }
}

export default new PublisherController();

import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import verificationCodeModel, {
  VerificationStatus,
  VerificationType,
} from 'models/verificationCode.model.js';
import {
  ACCESS_TOKEN_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRATION_TIME,
  RESET_PASSWORD_TOKEN_EXPIRATION_TIME,
} from 'constants/index.js';
import emailModel, { EmailSource, EmailType } from 'models/email.model.js';
import { env } from '@config/env.js';
import { LoginStatus } from 'models/login.model.js';
import forgotPasswordEmailTemplate from 'mail/templates/auth/forgotPasswordEmail.template.js';
import { registerQueue } from 'queues/register.queue.js';
import { loginTrackerQueue } from 'queues/loginTracker.queue.js';
import { sendEmailQueue } from 'queues/sendEmail.queue.js';
import { logoutCleanupQueue } from 'queues/logoutCleanup.queue.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import stripAnsi from 'strip-ansi';

class UserAuthController {
  /**
   * Gets the user register page.
   *
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   *
   * @returns {Promise<void>} Promise resolved when the user register page is rendered
   */
  async getUserRegisterPage(req: Request, res: Response) {
    Logger.info('Getting user register page...');

    if (req?.session?.user) {
      req.flash('info', 'You are already logged in');
      return res.redirect('/');
    }

    return res.render('users/auth/register', {
      title: 'User | Register',
      pageTitle: 'User Register',
    });
  }

  /**
 * Gets the user verify email page.
 *
 * @param {Request} req - HTTP request
 * @param {Response} res - HTTP response
 *
 * @returns {Promise<void>} Promise resolved when the user verify email page is rendered
 
 */
  async getUserVerifyOtpPage(req: Request, res: Response) {
    Logger.info('Getting user verify email page...');

    // 1. Get userId from session
    if (req?.session?.user) {
      req.flash('info', 'You are already logged in');
      return res.redirect('/');
    }

    const userId = req.session.registeredUser?._id;

    return res.render('users/auth/verify-otp', {
      title: 'User | Verify Otp',
      pageTitle: 'User Verify Otp',
      userId,
    });
  }

  /**
   * Gets the user resend OTP page.
   *
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   *
   * @returns {Promise<void>} Promise resolved when the user resend OTP page is rendered
   *
   * @throws {Error} If userId is not found in the query string
   */
  async getUserResendOtpPage(req: Request, res: Response) {
    Logger.info('Getting user resend otp page...');

    if (req?.session?.user) {
      req.flash('info', 'You are already logged in');
      return res.redirect('/');
    }

    const userId = req.session.registeredUser?._id;

    return res.render('users/auth/resend-otp', {
      title: 'User | Resend OTP',
      pageTitle: 'User Resend OTP',
      userId: userId,
    });
  }

  /**
   * Gets the user resend verification page.
   *
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   *
   * @returns {Promise<void>} Promise resolved when the user resend verification page is rendered
   *
   * @throws {Error} If userId is not found in the query string
   */
  async getUserResendVerificationPage(req: Request, res: Response) {
    Logger.info('Getting User resend verification page...');

    if (req?.session?.user) {
      req.flash('info', 'You are already logged in');
      return res.redirect('/');
    }

    const userId = req.session.registeredUser?._id;

    return res.render('users/auth/resend-verification', {
      title: 'User | Resend Verification',
      pageTitle: 'User Resend Verification',
      userId: userId,
    });
  }

  /**
   * Gets the user reset password page.
   *
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   *
   * @returns {Promise<void>} Promise resolved when the user reset password page is rendered
   */
  async getUserResetPasswordPage(req: Request, res: Response) {
    Logger.info('Getting user reset password page...');

    if (req?.session?.user) {
      req.flash('info', 'You are already logged in');
      return res.redirect('/');
    }

    if (!req.query.token) {
      Logger.warn('Reset password token not found');
      req.flash('error', 'Something went wrong please try again');
      return res.redirect('/users/auth/login');
    }

    return res.render('users/auth/reset-password', {
      title: 'User | Reset Password',
      pageTitle: 'User Reset Password',
      token: req.query.token,
    });
  }

  /**
   * Gets the user login page.
   *
   * If the user is already logged in, flashes an info message and redirects to the root page.
   *
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   *
   * @returns {Promise<void>} Promise resolved when the user login page is rendered
   */
  async getUserLoginPage(req: Request, res: Response) {
    Logger.info('Getting user login page...');

    if (req?.session?.user) {
      req.flash('info', 'You are already logged in');
      return res.redirect('/');
    }

    return res.render('users/auth/login', {
      title: 'User | Login',
      pageTitle: 'User Login',
    });
  }

  /**
   * Gets the user forget password page.
   *
   * If the user is already logged in, flashes an info message and redirects to the root page.
   *
   * @param {Request} req - HTTP request
   * @param {Response} res - HTTP response
   *
   * @returns {Promise<void>} Promise resolved when the user forget password page is rendered
   */
  async getUserForgetPasswordPage(req: Request, res: Response) {
    Logger.info('Getting user forget password page...');

    if (req?.session?.user) {
      req.flash('info', 'You are already logged in');
      return res.redirect('/');
    }

    return res.render('users/auth/forgot-password', {
      title: 'User | Forgot Password',
      pageTitle: 'User Forgot Password',
    });
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
        throw new Error('Your account is already registered please try login');
      }

      // 3. Hash Password
      const hashPassword = await authHelper.hashPasswordHelper(password);
      if (!hashPassword) {
        Logger.warn('Hashing password failed');
        throw new Error('Error occurred while registering your account please try again');
      }

      // 4. Create new user in DB
      const newUser = await userModel.create({
        username,
        email,
        passwordHash: hashPassword,
      });

      // TODO: BULL MQ
      await registerQueue.add('registerUser', {
        newUser: {
          _id: newUser?._id.toString(),
          username: newUser?.username,
          email: newUser?.email,
        },
      });

      req.session.registeredUser = {
        _id: newUser?._id.toString(),
        username: newUser?.username,
        email: newUser?.email,
      };

      Logger.info('User has been registered successfully');
      req.flash('success', 'Account Verification email has been sent to your email');
      return res.redirect('/users/auth/verify-otp');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/users/auth/register');
    }
  }

  async userVerifyOtpHandler(req: Request, res: Response) {
    try {
      Logger.info('Verifying user otp...');

      const { otp, userId } = req.body;

      //Find user by id
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error('Your account is not registered Please register first');
      }

      //Check if user has already verified or not
      if (user.isEmailVerified) {
        throw new Error('Email already verified please login');
      }

      // 3. Find verification code record by user id
      const verificationCodeRecord = await verificationCodeModel.findOne({
        userId,
        verificationType: VerificationType.EMAIL_VERIFICATION,
        verificationCodeExpiration: { $gt: new Date() },
        verificationStatus: VerificationStatus.PENDING,
      });
      if (!verificationCodeRecord) {
        throw new Error('Invalid otp please try again');
      }

      // 4. Verify otp
      const isOtpVerified = await authHelper.verifyOtpHelper(
        otp,
        verificationCodeRecord.verificationCode,
      );
      if (!isOtpVerified) {
        throw new Error('Invalid otp please try again');
      }

      // 5. Update user status
      user.isEmailVerified = true;
      user.status = UserStatus.ACTIVE;
      await user.save({ validateBeforeSave: false });

      // 6. Update verification code record status
      verificationCodeRecord.verificationStatus = VerificationStatus.USED;
      await verificationCodeRecord.save({ validateBeforeSave: false });

      req.flash('success', 'Account has been verified successfully please login');
      return res.redirect('/users/auth/login');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/users/auth/verify-otp');
    }
  }

  async userResendOTPHandler(req: Request, res: Response) {
    const { userId } = req.body;

    try {
      Logger.info('Resending User OTP...');

      const user = await userModel.findOne({
        _id: userId,
        role: UserRole.USER,
      });

      if (!user) {
        throw new Error(
          'Your account is not eligible for OTP verification, please contact support',
        );
      }

      const latestOtp = await verificationCodeModel
        .findOne({
          userId: user._id.toString(),
          verificationType: VerificationType.EMAIL_VERIFICATION,
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
          userId: user._id.toString(),
          verificationType: VerificationType.EMAIL_VERIFICATION,
          verificationStatus: VerificationStatus.PENDING,
        },
        { $set: { verificationStatus: VerificationStatus.EXPIRED } },
      );

      const rawToken = authHelper.generateResetPasswordSecret(user);
      const hashedOtp = authHelper.hashVerificationCodeHelper(rawToken as string);

      await verificationCodeModel.findOneAndUpdate(
        { userId: user._id, verificationType: VerificationType.EMAIL_VERIFICATION },
        {
          $set: {
            verificationCode: hashedOtp,
            verificationCodeExpiration: new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRATION_TIME),
            verificationStatus: VerificationStatus.PENDING,
          },
        },
        { upsert: true, new: true },
      );

      // TODO: BULL MQ
      await registerQueue.add('registerUser', {
        newUser: {
          _id: user?._id.toString(),
          username: user?.username,
          email: user?.email,
        },
      });

      req.flash('success', 'A new OTP has been sent to your email');
      return res.redirect('/users/auth/resend-otp');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/users/auth/resend-otp');
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
        await loginTrackerQueue.add('login-tracker', {
          userId: 'GUEST',
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        throw new Error('Invalid email or password');
      }

      // 2. Check user is blocked or disabled or deleted
      if (user.status !== UserStatus.ACTIVE) {
        await loginTrackerQueue.add('login-tracker', {
          userId: user._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        throw new Error('Your account is not active');
      }

      // 3. Compare password
      const isPasswordCompareCorrect = await authHelper.comparePasswordHelper(
        password,
        user.passwordHash,
      );
      if (!isPasswordCompareCorrect) {
        await loginTrackerQueue.add('login-tracker', {
          userId: user._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });

        throw new Error('Invalid email or password');
      }

      // 4. Generate JWT tokens
      const tokens = authHelper.signAccessTokenAndRefreshToken(user);
      if (!tokens) {
        Logger.warn('Generating JWT tokens failed');
        await loginTrackerQueue.add('login-tracker', {
          userId: user._id.toString(),
          lastLoginIp: ip,
          lastLoginUserAgent: userAgent,
          lastLoginStatus: LoginStatus.FAILED,
        });
        throw new Error('Error occurred while logging in please try again');
      }

      // 5. Store refresh token in db
      const newRefreshTokenRecord = await refreshTokenModel.create({
        userId: user._id,
        tokenHash: tokens.refreshToken,
        expiresAt: REFRESH_TOKEN_EXPIRATION_TIME,
        ip,
        userAgent,
      });

      Logger.debug('User has been logged in successfully');

      await loginTrackerQueue.add('login-tracker', {
        userId: user._id.toString(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginStatus: LoginStatus.SUCCESS,
        lastLoginAt: new Date(),
      });

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
          maxAge: ACCESS_TOKEN_EXPIRATION_TIME,
        })
        .cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_EXPIRATION_TIME,
        })
        .redirect('/');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', stripAnsi(error.message));
      return res.redirect('/users/auth/login');
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
        throw new Error('Invalid email or your account is not active');
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
        throw new Error('OTP already sent. Please check your email');
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
        throw new Error('Something went wrong please try again');
      }

      // 6.Hashed otp before storing in db
      const hashedOtp = authHelper.hashVerificationCodeHelper(rawToken);
      if (!hashedOtp) {
        Logger.warn('OTP hashing failed');
        throw new Error('Something went wrong please try again');
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
        recipient: user?._id,
        recipientEmail: user?.email,
        subject: 'Password Reset Request',
        type: EmailType.PASSWORD_RESET,
        source: EmailSource.SYSTEM,
        sendAt: new Date(),
        body: forgotPasswordEmailTemplate({
          username: user.username,
          reset_url: resetPasswordLink,
          expiry_minutes: RESET_PASSWORD_TOKEN_EXPIRATION_TIME / 1000 / 60,
          year: new Date().getFullYear(),
        }),
      });

      await sendEmailQueue.add('send-email', {
        emailId: mailRecord._id.toString(),
      });

      Logger.debug('Email sent for forgot password');

      req.flash('success', 'Password reset email has been sent to your email');
      return res.redirect('/users/auth/resend-verification');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/users/auth/forgot-password');
    }
  }

  async userResendForgotPasswordLinkHandler(req: Request, res: Response) {
    const { userId } = req.body;

    try {
      Logger.info('Resending User OTP...');

      const user = await userModel.findOne({
        _id: userId,
        role: UserRole.USER,
      });

      if (!user) {
        throw new Error(
          'Your account is not eligible for OTP verification, please contact support',
        );
      }

      const latestOtp = await verificationCodeModel
        .findOne({
          userId: user._id.toString(),
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
          userId: user._id.toString(),
          verificationType: VerificationType.PASSWORD_RESET,
          verificationStatus: VerificationStatus.PENDING,
        },
        { $set: { verificationStatus: VerificationStatus.EXPIRED } },
      );

      const rawToken = authHelper.generateResetPasswordSecret(user);
      const hashedOtp = authHelper.hashVerificationCodeHelper(rawToken as string);

      await verificationCodeModel.findOneAndUpdate(
        { userId: user._id, verificationType: VerificationType.PASSWORD_RESET },
        {
          $set: {
            verificationCode: hashedOtp,
            verificationCodeExpiration: new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRATION_TIME),
            verificationStatus: VerificationStatus.PENDING,
          },
        },
        { upsert: true, new: true },
      );

      const resetPasswordLink = `${env.CLIENT_URL}/users/auth/reset-password?token=${rawToken}`;

      const mailRecord = await emailModel.create({
        recipient: user?._id,
        recipientEmail: user?.email,
        subject: 'Password Reset Request',
        type: EmailType.PASSWORD_RESET,
        source: EmailSource.SYSTEM,
        sendAt: new Date(),
        body: forgotPasswordEmailTemplate({
          username: user.username,
          reset_url: resetPasswordLink,
          expiry_minutes: RESET_PASSWORD_TOKEN_EXPIRATION_TIME / 1000 / 60,
          year: new Date().getFullYear(),
        }),
      });

      await sendEmailQueue.add('send-email', {
        emailId: mailRecord._id.toString(),
      });

      req.flash('success', 'A new OTP has been sent to your email');
      return res.redirect('/users/auth/resend-verification');
    } catch (error: any) {
      Logger.error(error.message);

      req.flash('error', error.message);
      return res.redirect('/users/auth/resend-verification');
    }
  }

  async userResetPasswordHandler(req: Request, res: Response) {
    const { token, password, confirmPassword } = req.body;

    try {
      Logger.info('User reset password request received');

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

      if (!user || user.role !== UserRole.USER) {
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

      req.flash('success', 'Password reset successfully');
      req.session.destroy(() => {
        res
          .clearCookie('app_session')
          .clearCookie('refreshToken')
          .clearCookie('accessToken')
          .redirect('/users/auth/login');
      });
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect(`/users/auth/reset-password?token=${token}`);
    }
  }

  async userLogoutHandler(req: Request, res: Response) {
    try {
      Logger.info('User logging out...');

      const userId = req?.user?._id;
      if (!userId) {
        return res.redirect('/users/auth/login');
      }

      // TODO: BULL MQ JOB FOR DELETING REFRESH TOKEN, EMAILS, VERIFICATION CODES
      await logoutCleanupQueue.add('cleanup-auth-data', {
        userId: userId.toString(),
      });

      req.flash('success', 'Logged out successfully');

      req.session.user = null as any;

      req.session.destroy(() => {
        res
          .clearCookie('app_session')
          .clearCookie('refreshToken')
          .clearCookie('accessToken')
          .redirect('/users/auth/login');
      });
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/users/auth/login');
    }
  }
}

export default new UserAuthController();

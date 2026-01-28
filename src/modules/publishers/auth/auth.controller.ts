// import type { Request, Response } from 'express';
// import userModel, { UserRole, UserStatus } from 'models/user.model.js';
// import authHelper from '@modules/auth/auth.helper.js';
// import verificationCodeModel, {
//   VerificationStatus,
//   VerificationType,
// } from 'models/verificationCode.model.js';
// import {
//   REFRESH_TOKEN_EXPIRATION_TIME,
//   RESET_PASSWORD_TOKEN_EXPIRATION_TIME,
//   VERIFICATION_CODE_EXPIRATION_TIME,
// } from 'constants/index.js';
// import Logger from '@config/logger.js';
// import {
//   TUserForgotPasswordDTO,
//   TUserLoginDTO,
//   TUserRegisterDTO,
//   TUserResetPasswordDTO,
//   TUserResetPasswordQueryDTO,
//   TUserVerifyOtpDTO,
//   TVerifyOtpQueryDTO,
// } from './auth.validations.js';
// import refreshTokenModel from 'models/refreshToken.model.js';
// import { env } from '@config/env.js';
// import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from '@modules/auth/auth.constants.js';
// import authRepo from '@modules/auth/auth.repo.js';
// import { LoginStatus } from 'models/login.model.js';
// import emailModel, { EmailStatus } from 'models/email.model.js';
// import emailVerificationEmailTemplate from 'mail/templates/auth/emailVerification.template.js';
// import { sendEmailService } from 'mail/index.js';
// import forgotPasswordEmailTemplate from 'mail/templates/auth/forgotPasswordEmail.template.js';
// class PublisherAuthController {
//   /**
//    * Renders the user verify otp page.
//    *
//    * @param {Request} req - The incoming request.
//    * @param {Response} res - The outgoing response.
//    * @returns {Promise<Response>} - A promise that resolves with the rendered verify otp page.
//    * @throws {Error} - If any error occurs while rendering the verify otp page.
//    */
//   async renderPublisherVerifyOtpPage(req: Request, res: Response) {
//     try {
//       Logger.info('Getting publisher verify email page...');

//       // 1. Get userId from session
//       const userId = req.session.pendingUser?.userId;
//       if (!userId) {
//         Logger.warn('publisher id not found');

//         req.flash('error', 'publisher id not found please try again');
//         return res.redirect('/publishers/auth/register');
//       }

//       return res.render('publishers/auth/verify-otp', {
//         title: 'Publisher | Verify Otp',
//         pageTitle: 'Publisher Verify Otp',
//         userId,
//       });
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/publishers/auth/register');
//     }
//   }

//   /**
//    * Verifies the user otp.
//    *
//    * @param {Request} req - The incoming request.
//    * @param {Response} res - The outgoing response.
//    * @returns {Promise<Response>} - A promise that resolves with the rendered login page.
//    * @throws {Error} - If any error occurs while verifying the user otp.
//    */
//   async publisherVerifyOtpHandler(req: Request<object, object, TUserVerifyOtpDTO>, res: Response) {
//     try {
//       Logger.info('Verifying publisher otp...');
//       const { otp, userId } = req.body;

//       // Validate user id
//       if (!userId) {
//         Logger.warn('publisher id not found');

//         req.flash('error', 'publisher id not found please try again');
//         return res.redirect('/publishers/auth/register');
//       }

//       // 1. Find user by id
//       const user = await userModel.findById(userId);
//       if (!user) {
//         Logger.warn('Publisher not found');

//         req.flash('error', 'Your account is not registered Please register first');
//         return res.redirect('/publishers/auth/register');
//       }

//       // 2. Check if user has already verified or not
//       if (user.isEmailVerified) {
//         Logger.warn('Email already verified');

//         req.flash('error', 'Email already verified please login');
//         return res.redirect('/publishers/auth/login');
//       }

//       // 3. Find verification code record by user id
//       const verificationCodeRecord = await verificationCodeModel.findOne({
//         userId,
//         verificationType: VerificationType.EMAIL_VERIFICATION,
//         verificationCodeExpiration: { $gt: new Date() },
//         verificationStatus: VerificationStatus.PENDING,
//       });
//       if (!verificationCodeRecord) {
//         Logger.warn('Verification code not found');

//         req.flash('error', 'Invalid otp please try again');
//         return res.redirect('/publishers/auth/verify-otp');
//       }

//       // 4. Verify otp
//       const isOtpVerified = await authHelper.verifyOtpHelper(
//         otp,
//         verificationCodeRecord.verificationCode,
//       );
//       if (!isOtpVerified) {
//         Logger.warn('Invalid otp');

//         req.flash('error', 'Invalid otp please try again');
//         return res.redirect('/publishers/auth/verify-otp');
//       }

//       // 5. Update user status
//       user.isEmailVerified = true;
//       user.status = UserStatus.ACTIVE;
//       await user.save({ validateBeforeSave: false });

//       // 6. Update verification code record status
//       verificationCodeRecord.verificationStatus = VerificationStatus.USED;
//       await verificationCodeRecord.save({ validateBeforeSave: false });

//       Logger.debug('Publisher has been verified successfully');

//       req.flash('success', 'Account has been verified successfully please login');
//       return res.redirect('/publishers/auth/login');
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/publishers/auth/login');
//     }
//   }

//   /**
//    * Renders the user resend otp page.
//    *
//    * @param {Request} req - The incoming request.
//    * @param {Response} res - The outgoing response.
//    *
//    * @throws {Error} - If any error occurs while rendering the resend otp page.
//    *
//    * @returns {Promise<Response>} - A promise that resolves with the rendered resend otp page.
//    */
//   async renderUserResendOtpPage(req: Request, res: Response) {
//     try {
//       Logger.info('Getting publisher resend otp page...');

//       const userId = req.session.pendingUser?.userId;
//       if (!userId) {
//         Logger.warn('Publisher id not exits on query params');

//         req.flash('error', 'Something went wrong please try again');
//         return res.redirect('/publishers/auth/login');
//       }

//       return res.render('publishers/auth/resend-otp', {
//         title: 'User | Resend Otp',
//         pageTitle: 'User Resend Otp',
//         userId,
//       });
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/publishers/auth/login');
//     }
//   }

//   /**
//    * Handles the user resend otp request.
//    *
//    * @throws {Error} - If any error occurs while handling the resend otp request.
//    *
//    * @returns {Promise<Response>} - A promise that resolves with the rendered resend otp page.
//    */
//   async userResendOtpHandler(req: Request, res: Response) {
//     try {
//       Logger.info('Resending user OTP...');
//       const { userId } = req.body;

//       // 1. Validate user id
//       const user = await userModel.findOne({
//         _id: userId,
//         isDeleted: false,
//         status: UserStatus.PENDING,
//         isEmailVerified: false,
//       });

//       if (!user) {
//         Logger.warn('Invalid resend OTP request');

//         req.flash('error', 'Your account is not eligible for OTP verification');
//         return res.redirect('/publishers/auth/login');
//       }

//       //2 Get latest verification code
//       const latestOtp = await verificationCodeModel
//         .findOne({
//           userId: user._id.toString(),
//           verificationType: VerificationType.EMAIL_VERIFICATION,
//         })
//         .sort({ createdAt: -1 });

//       const now = new Date();

//       //3. If OTP exists & still valid → BLOCK resend
//       if (
//         latestOtp &&
//         latestOtp.verificationStatus === VerificationStatus.PENDING &&
//         latestOtp.verificationCodeExpiration > now
//       ) {
//         Logger.warn('OTP resend blocked — OTP still valid');

//         req.flash('error', 'OTP already sent. Please wait before requesting a new one.');
//         return res.redirect('/publishers/auth/verify-otp');
//       }

//       //4: Invalidate all previous OTPs
//       await verificationCodeModel.updateMany(
//         {
//           userId: user._id.toString(),
//           verificationType: VerificationType.EMAIL_VERIFICATION,
//           verificationStatus: VerificationStatus.PENDING,
//         },
//         {
//           $set: { verificationStatus: VerificationStatus.EXPIRED },
//         },
//       );

//       //5: Generate new OTP
//       const rawOtp = authHelper.generateRandomOtp();
//       if (!rawOtp) {
//         Logger.warn('OTP generation failed');

//         req.flash('error', 'Something went wrong please try again');
//         return res.redirect('/publishers/auth/login');
//       }

//       const hashedOtp = authHelper.hashVerificationCodeHelper(rawOtp.toString());
//       if (!hashedOtp) {
//         Logger.warn('OTP hashing failed');

//         req.flash('error', 'Something went wrong please try again');
//         return res.redirect('/publishers/auth/login');
//       }

//       // 6: Store new OTP
//       await verificationCodeModel.create({
//         userId: user._id.toString(),
//         verificationCode: hashedOtp,
//         verificationCodeExpiration: new Date(Date.now() + VERIFICATION_CODE_EXPIRATION_TIME),
//         verificationType: VerificationType.EMAIL_VERIFICATION,
//         verificationStatus: VerificationStatus.PENDING,
//       });

//       //7 Prepare & store email
//       const emailBody = emailVerificationEmailTemplate({
//         OTP: rawOtp.toString(),
//         USERNAME: user.username,
//         EXPIRY_MINUTES: VERIFICATION_CODE_EXPIRATION_TIME / 1000 / 60,
//       });

//       const emailRecord = await emailModel.findOneAndUpdate(
//         {
//           recipient: user._id,
//           recipientEmail: user.email,
//         },
//         {
//           $set: {
//             subject: 'Email Verification',
//             body: emailBody,
//             status: EmailStatus.PENDING,
//             sendAt: new Date(),
//             source: UserRole.USER,
//           },
//         },
//         { upsert: true, new: true },
//       );

//       //8. Send email
//       await sendEmailService({
//         recipient: emailRecord.recipientEmail,
//         subject: emailRecord.subject,
//         htmlTemplate: emailRecord.body,
//       });

//       Logger.info('OTP resent successfully');

//       req.flash('success', 'A new OTP has been sent to your email');
//       return res.redirect('/publishers/auth/verify-otp');
//     } catch (error) {
//       Logger.warn((error as Error).message);

//       req.flash('error', 'Something went wrong. Please try again.');
//       return res.redirect('/publishers/auth/login');
//     }
//   }

//   /**
//    * Renders the user login page.
//    *
//    * @param {Request} req - The incoming request.
//    * @param {Response} res - The outgoing response.
//    * @returns {Promise<Response>} - A promise that resolves with the rendered login page.
//    * @throws {Error} - If any error occurs while rendering the login page.
//    */
//   async renderUserLoginPage(req: Request, res: Response) {
//     try {
//       Logger.info('Getting user login page...');

//       return res.render('users/auth/login', {
//         title: 'User | Login',
//         pageTitle: 'User Login',
//       });
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/publishers/auth/register');
//     }
//   }

//   /**
//    * Handles the login functionality for users.
//    *
//    * @param {Request} req - The incoming request.
//    * @param {Response} res - The outgoing response.
//    *
//    * @throws {Error} - If any error occurs while logging in.
//    *
//    * @returns {Promise<Response>} - A promise that resolves with the rendered login page or redirects to the login page with an error message.
//    */
//   async userLoginHandler(req: Request<object, object, TUserLoginDTO>, res: Response) {
//     try {
//       Logger.info(`User Login route called with data: ${JSON.stringify(req.body)}`);

//       const ip = req.ip as string;
//       const userAgent = req.headers['user-agent'] as string;
//       const { email, password } = req.body;
//       const normalizedEmail = email.trim().toLowerCase();

//       // 1. Find user by email
//       const user = await userModel
//         .findOne({ email: normalizedEmail, isEmailVerified: true, role: UserRole.USER })
//         .select('+passwordHash');
//       if (!user) {
//         Logger.warn('User not found');

//         await authRepo.createLoginRecord({
//           lastLoginIp: ip,
//           lastLoginUserAgent: userAgent,
//           lastLoginStatus: LoginStatus.FAILED,
//         });

//         req.flash('error', 'Invalid email or password');
//         return res.redirect('/publishers/auth/login');
//       }

//       // 2. Check user is blocked or disabled or deleted
//       if (user.status !== UserStatus.ACTIVE) {
//         Logger.warn('User not found');

//         await authRepo.createLoginRecord({
//           userId: user._id.toString(),
//           lastLoginIp: ip,
//           lastLoginUserAgent: userAgent,
//           lastLoginStatus: LoginStatus.FAILED,
//         });

//         req.flash('error', 'Your account is not active');
//         return res.redirect('/publishers/auth/login');
//       }

//       // 3. Compare password
//       const isPasswordCompareCorrect = await authHelper.comparePasswordHelper(
//         password,
//         user.passwordHash,
//       );
//       if (!isPasswordCompareCorrect) {
//         Logger.warn('Password is incorrect');

//         await authRepo.createLoginRecord({
//           userId: user._id.toString(),
//           lastLoginIp: ip,
//           lastLoginUserAgent: userAgent,
//           lastLoginStatus: LoginStatus.FAILED,
//         });

//         req.flash('error', 'Invalid email or password');
//         return res.redirect('/publishers/auth/login');
//       }

//       // 4. Generate JWT tokens
//       const tokens = authHelper.signAccessTokenAndRefreshToken(user);
//       if (!tokens) {
//         Logger.warn('Generating JWT tokens failed');

//         await authRepo.createLoginRecord({
//           userId: user._id.toString(),
//           lastLoginIp: ip,
//           lastLoginUserAgent: userAgent,
//           lastLoginStatus: LoginStatus.FAILED,
//         });

//         req.flash('error', 'Error occurred while logging in please try again');
//         return res.redirect('/publishers/auth/login');
//       }

//       // 5. Store refresh token in db
//       const newRefreshTokenRecord = await refreshTokenModel.create({
//         userId: user._id,
//         tokenHash: tokens.refreshToken,
//         expiresAt: REFRESH_TOKEN_EXPIRATION_TIME,
//         ip,
//         userAgent,
//       });
//       if (!newRefreshTokenRecord) {
//         Logger.warn('Storing refresh token failed');

//         req.flash('error', 'Error occurred while logging in please try again');
//         return res.redirect('/publishers/auth/login');
//       }

//       Logger.debug('User has been logged in successfully');

//       // 6. Create login record in db
//       const loginRecord = await authRepo.createLoginRecord({
//         userId: user._id.toString(),
//         lastLoginIp: ip,
//         lastLoginUserAgent: userAgent,
//         lastLoginStatus: LoginStatus.SUCCESS,
//       });
//       if (!loginRecord) {
//         Logger.warn('Storing login record failed');

//         req.flash('error', 'Error occurred while logging in please try again');
//         return res.redirect('/publishers/auth/login');
//       }

//       Logger.debug('User login record has been created successfully');

//       // 7. Send accessToken and refreshToken to client cookies
//       req.flash('success', 'Logged in successfully');
//       return res
//         .cookie('accessToken', tokens.accessToken, {
//           httpOnly: true,
//           secure: env.NODE_ENV === 'production',
//           sameSite: 'strict',
//           maxAge: ACCESS_TOKEN_TTL,
//         })
//         .cookie('refreshToken', tokens.refreshToken, {
//           httpOnly: true,
//           secure: env.NODE_ENV === 'production',
//           sameSite: 'strict',
//           maxAge: REFRESH_TOKEN_TTL,
//         })
//         .redirect('/publishers/profile');
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/publishers/auth/forgot-password');
//     }
//   }

//   /**
//    * Renders the user forgot password page.
//    *
//    * @param {Request} req - The incoming request.
//    * @param {Response} res - The outgoing response.
//    * @returns {Promise<Response>} - A promise that resolves with the rendered forgot password page.
//    * @throws {Error} - If any error occurs while rendering the forgot password page.
//    */
//   async renderUserForgetPasswordPage(req: Request, res: Response) {
//     try {
//       Logger.info('Getting user forget password page...');

//       return res.render('publishers/auth/forgot-password', {
//         title: 'User | Forgot Password',
//         pageTitle: 'User Forgot Password',
//       });
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/publishers/auth/forgot-password');
//     }
//   }

//   /**
//    * Handles the forgot password functionality for users.
//    *
//    * @param {Request} req - The incoming request.
//    * @param {Response} res - The outgoing response.
//    * @returns {Promise<Response>} - A promise that resolves with the rendered forgot password page or redirects to the forgot password page with an error message.
//    * @throws {Error} - If any error occurs while handling the forgot password functionality for users.
//    */
//   async userForgotPasswordHandler(
//     req: Request<object, object, TUserForgotPasswordDTO>,
//     res: Response,
//   ) {
//     try {
//       Logger.info('Getting user forget password page...');
//       const { email } = req.body;

//       const normalizedEmail = email.trim().toLowerCase();

//       // 1. Check user exist or not
//       const user = await userModel.findOne({
//         email: normalizedEmail,
//         isEmailVerified: true,
//         role: UserRole.USER,
//         status: UserStatus.ACTIVE,
//       });
//       if (!user) {
//         Logger.warn('User not found');

//         req.flash('error', 'Invalid email or your account is not active');
//         return res.redirect('/users/auth/forgot-password');
//       }

//       // 2. Generate reset password token
//       const rawResetPasswordToken = authHelper.generateResetPasswordSecret(user);
//       if (!rawResetPasswordToken) {
//         Logger.warn('Generating reset password token failed');

//         req.flash('error', 'Error occurred while resetting password please try again');
//         return res.redirect('/users/auth/forgot-password');
//       }

//       // 3. Store reset password token in db
//       const resetPasswordTokenRecord = await verificationCodeModel.create({
//         userId: user._id,
//         verificationCode: rawResetPasswordToken,
//         verificationCodeExpiration: new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRATION_TIME),
//         verificationType: VerificationType.PASSWORD_RESET,
//       });
//       if (!resetPasswordTokenRecord) {
//         Logger.warn('Storing reset password token failed');

//         req.flash('error', 'Error occurred while resetting password please try again');
//         return res.redirect('/users/auth/forgot-password');
//       }

//       Logger.debug('User reset password token has been created successfully');

//       // 5. Send reset password token to user email
//       const resetPasswordLink = `${env.CLIENT_URL}/users/auth/reset-password?token=${rawResetPasswordToken}`;

//       // Store Mail data in db
//       const mailRecord = await emailModel.create({
//         recipient: user._id,
//         recipientEmail: user.email,
//         subject: 'Password Reset Request',
//         source: UserRole.USER,
//         sendAt: new Date(),
//         body: forgotPasswordEmailTemplate({
//           username: user.username,
//           reset_url: resetPasswordLink,
//           expiry_minutes: RESET_PASSWORD_TOKEN_EXPIRATION_TIME / 60,
//           year: new Date().getFullYear(),
//         }),
//       });
//       if (!mailRecord) {
//         Logger.warn('Storing mail data failed');

//         req.flash('error', 'Error occurred while resetting password please try again');
//         return res.redirect('/users/auth/forgot-password');
//       }

//       // TODO: Send reset password email
//       await sendEmailService({
//         recipient: user.email,
//         subject: mailRecord.subject,
//         htmlTemplate: mailRecord.body,
//       });

//       Logger.debug('Email sent for forgot password');

//       req.flash('success', 'Password reset email has been sent to your email');
//       res.redirect('/users/auth/forgot-password');
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/users/auth/forgot-password');
//     }
//   }

//   /**
//    * Renders the user reset password page.
//    *
//    * @param {Request} req - The incoming request.
//    * @param {Response} res - The outgoing response.
//    * @returns {Promise<Response>} - A promise that resolves with the rendered reset password page.
//    * @throws {Error} - If any error occurs while rendering the reset password page.
//    */
//   async renderUserResetPasswordPage(
//     req: Request<object, object, object, TUserResetPasswordQueryDTO>,
//     res: Response,
//   ) {
//     try {
//       Logger.info('Getting user reset password page...');

//       return res.render('users/auth/reset-password', {
//         title: 'User | Reset Password',
//         pageTitle: 'User Reset Password',
//         token: req.query.token,
//       });
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/users/auth/reset-password');
//     }
//   }

//   /**
//    * Handles the reset password functionality for users.
//    *
//    * @param {Request} req - The incoming request.
//    * @param {Response} res - The outgoing response.
//    * @returns {Promise<Response>} - A promise that resolves with the rendered login page or redirects to the forgot password page with an error message.
//    * @throws {Error} - If any error occurs while handling the reset password functionality for users.
//    */
//   async userResetPasswordHandler(
//     req: Request<object, object, TUserResetPasswordDTO>,
//     res: Response,
//   ) {
//     try {
//       Logger.info('Getting user reset password page...');

//       const { token, password, confirmPassword } = req.body;

//       // 1. Check password and confirm password match
//       if (password !== confirmPassword) {
//         Logger.warn('Password and confirm password are not same');

//         req.flash('error', 'Password and confirm password are not same');
//         return res.redirect('/users/auth/reset-password');
//       }

//       // 2. Verify reset password token
//       const tokenPayload = authHelper.verifyResetPasswordSecret(token);
//       if (!tokenPayload?.sub) {
//         Logger.warn('Reset password token is invalid or expired');

//         req.flash('error', 'Reset password token is invalid or expired');
//         return res.redirect('/users/auth/reset-password');
//       }

//       // 3. Hash password
//       const passwordHash = await authHelper.hashPasswordHelper(password);
//       if (!passwordHash) {
//         Logger.warn('Hashing password failed');

//         req.flash('error', 'Hashing password failed');
//         return res.redirect('/users/auth/reset-password');
//       }

//       // 4. Update user password
//       const updatedUser = await userModel.findByIdAndUpdate(
//         tokenPayload.sub,
//         { passwordHash },
//         { new: true },
//       );
//       if (!updatedUser) {
//         Logger.warn('Updating user password failed');

//         req.flash('error', 'Updating user password failed');
//         return res.redirect('/users/auth/reset-password');
//       }

//       // 5. Remove refresh token if exists
//       await refreshTokenModel.deleteOne({ userId: updatedUser._id });

//       // 6. Change verificationCode status to USED
//       const updatedResetPasswordTokenRecord = await verificationCodeModel.findOneAndUpdate(
//         { userId: updatedUser._id },
//         { $set: { status: VerificationStatus.USED } },
//         { new: true },
//       );
//       if (!updatedResetPasswordTokenRecord) {
//         Logger.warn('Updating reset password token record failed');

//         req.flash('error', 'Updating reset password token record failed');
//         return res.redirect('/users/auth/reset-password');
//       }

//       req.flash('success', 'Password reset successfully');
//       return res.redirect('/users/auth/login');
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/users/auth/reset-password');
//     }
//   }

//   async userLogoutHandler(req: Request, res: Response) {
//     try {
//       Logger.info('User logging out...');
//       const userId = req.user?.userId || req.session.pendingUser?.userId;

//       // 1.Validate user id
//       if (!userId) {
//         Logger.warn('User id not found');

//         req.flash('error', 'Some error occurred please try again');
//         return res.redirect('/users/profile');
//       }
//       // 2. Delete refresh token
//       const deletedRefreshTokenRecord = await refreshTokenModel.deleteMany({
//         userId,
//       });
//       if (!deletedRefreshTokenRecord) {
//         Logger.warn('Deleting refresh token record failed');

//         req.flash('error', 'Some error occurred please try again');
//         return res.redirect('/users/profile');
//       }

//       // 3. Clear cookies
//       req.flash('success', 'Logged out successfully');
//       return res
//         .clearCookie('refreshToken')
//         .clearCookie('accessToken')
//         .redirect('/users/auth/login');
//     } catch (error) {
//       Logger.warn(`${(error as Error).message}`);

//       req.flash('error', (error as Error).message);
//       return res.redirect('/users/auth/login');
//     }
//   }
// }

// export default new PublisherAuthController();

import { Router } from 'express';
import userAuthController from './user.auth.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';
import {
  forgotPasswordSchema,
  loginSchema,
  otpValidationSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
} from 'validations/auth.validations.js';
import { registerLimiter } from '@middlewares/rateLimit/registerLimiter.js';
import { verifyLimiter } from '@middlewares/rateLimit/verifyLimiter.js';
import { loginLimiter } from '@middlewares/rateLimit/loginLimiter.js';
import { forgotPasswordLimiter } from '@middlewares/rateLimit/forgotPasswordLimiter.js';
import { resetPasswordLimiter } from '@middlewares/rateLimit/resetPasswordLimiter.js';

const router: Router = Router();

router.get('/register', userAuthController.getUserRegisterPage);
router.get('/verify-otp', userAuthController.getUserVerifyOtpPage);
router.get('/resend-otp', userAuthController.getUserResendOtpPage);
router.get('/resend-verification', userAuthController.getUserResendVerificationPage);
router.get('/login', userAuthController.getUserLoginPage);
router.get('/forgot-password', userAuthController.getUserForgetPasswordPage);
router.get('/reset-password', userAuthController.getUserResetPasswordPage);

router.post(
  '/register',
  registerLimiter,
  validateRequest(registerSchema),
  userAuthController.userRegisterHandler,
);

router.post(
  '/verify-otp',
  verifyLimiter,
  validateRequest(otpValidationSchema),
  userAuthController.userVerifyOtpHandler,
);

router.post('/resend-otp', verifyLimiter, userAuthController.userResendOTPHandler);

router.post(
  '/resend-verification',
  verifyLimiter,
  validateRequest(resendOtpSchema),
  userAuthController.userResendForgotPasswordLinkHandler,
);

router.post(
  '/login',
  loginLimiter,
  validateRequest(loginSchema),
  userAuthController.userLoginHandler,
);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateRequest(forgotPasswordSchema),
  userAuthController.userForgotPasswordHandler,
);

router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  resetPasswordLimiter,
  userAuthController.userResetPasswordHandler,
);

router.post(
  '/logout',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.USER),
  userAuthController.userLogoutHandler,
);

export default router;

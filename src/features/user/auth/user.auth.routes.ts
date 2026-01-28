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

const router: Router = Router();

router.get('/register', userAuthController.getUserRegisterPage);

router.post(
  '/register',
  registerLimiter,
  validateRequest(registerSchema),
  userAuthController.userRegisterHandler,
);

router.get('/verify-otp', userAuthController.getUserVerifyOtpPage);

router.post(
  '/verify-otp',
  validateRequest(otpValidationSchema),
  userAuthController.userVerifyOtpHandler,
);

router.get('/resend-otp', userAuthController.getUserResendOtpPage);

router.post(
  '/resend-otp',
  validateRequest(resendOtpSchema),
  userAuthController.userResendOtpHandler,
);

router.get('/login', userAuthController.getUserLoginPage);

router.post('/login', validateRequest(loginSchema), userAuthController.userLoginHandler);

router.get('/forgot-password', userAuthController.getUserForgetPasswordPage);

router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  userAuthController.userForgotPasswordHandler,
);

router.get('/reset-password', userAuthController.getUserResetPasswordPage);

router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  userAuthController.userResetPasswordHandler,
);

router.post(
  '/logout',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.USER),
  userAuthController.userLogoutHandler,
);

export default router;

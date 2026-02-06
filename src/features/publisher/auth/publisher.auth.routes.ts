import { Router } from 'express';
import publisherAuthController from './publisher.auth.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';
import {
  forgotPasswordSchema,
  loginSchema,
  resendOtpSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
} from 'validations/auth.validations.js';
import { resetPasswordLimiter } from '@middlewares/rateLimit/resetPasswordLimiter.js';
import { verifyLimiter } from '@middlewares/rateLimit/verifyLimiter.js';
import { loginLimiter } from '@middlewares/rateLimit/loginLimiter.js';
import { forgotPasswordLimiter } from '@middlewares/rateLimit/forgotPasswordLimiter.js';

const router: Router = Router();

router.get('/login', publisherAuthController.getPublisherLoginPage);

router.get('/forgot-password', publisherAuthController.getPublisherForgetPasswordPage);

router.get(
  '/reset-password',
  validateRequest(resetPasswordTokenSchema, 'query'),
  publisherAuthController.getPublisherResetPasswordPage,
);

router.get(
  '/resend-verification',
  validateRequest(resendOtpSchema, 'query'),
  publisherAuthController.getPublisherResendVerificationPage,
);

router.post(
  '/login',
  // loginLimiter,
  validateRequest(loginSchema),
  publisherAuthController.publisherLoginHandler,
);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateRequest(forgotPasswordSchema),
  publisherAuthController.publisherForgotPasswordHandler,
);

router.post(
  '/resend-verification',
  verifyLimiter,
  validateRequest(resendOtpSchema),
  publisherAuthController.publisherResendOtpHandler,
);

router.post(
  '/reset-password',
  resetPasswordLimiter,
  validateRequest(resetPasswordSchema),
  publisherAuthController.publisherResetPasswordHandler,
);

router.post(
  '/logout',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.PUBLISHER),
  publisherAuthController.publisherLogoutHandler,
);

export default router;

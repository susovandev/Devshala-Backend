import { Router } from 'express';
import authorAuthController from './author.auth.controller.js';
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
import { loginLimiter } from '@middlewares/rateLimit/loginLimiter.js';
import { forgotPasswordLimiter } from '@middlewares/rateLimit/forgotPasswordLimiter.js';
import { verifyLimiter } from '@middlewares/rateLimit/verifyLimiter.js';
import { resetPasswordLimiter } from '@middlewares/rateLimit/resetPasswordLimiter.js';

const router: Router = Router();

router.get('/login', authorAuthController.getAuthorLoginPage);

router.get('/forgot-password', authorAuthController.getAuthorForgetPasswordPage);

router.get(
  '/reset-password',
  validateRequest(resetPasswordTokenSchema, 'query'),
  authorAuthController.getAuthorResetPasswordPage,
);

router.get(
  '/resend-verification',
  validateRequest(resendOtpSchema, 'query'),
  authorAuthController.getAuthorResendVerificationPage,
);

router.post(
  '/login',
  loginLimiter,
  validateRequest(loginSchema),
  authorAuthController.authorLoginHandler,
);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateRequest(forgotPasswordSchema),
  authorAuthController.authorForgotPasswordHandler,
);

router.post(
  '/resend-verification',
  verifyLimiter,
  validateRequest(resendOtpSchema),
  authorAuthController.authorResendOtpHandler,
);

router.post(
  '/reset-password',
  resetPasswordLimiter,
  validateRequest(resetPasswordSchema),
  authorAuthController.authorResetPasswordHandler,
);

router.post(
  '/logout',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.AUTHOR),
  authorAuthController.authorLogoutHandler,
);

export default router;

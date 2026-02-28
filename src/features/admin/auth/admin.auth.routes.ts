import { Router } from 'express';
import adminAuthController from './admin.auth.controller.js';
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

router.get('/login', adminAuthController.getAdminLoginPage);

router.get('/forgot-password', adminAuthController.getAdminForgetPasswordPage);

router.get(
  '/reset-password',
  // validateRequest(resetPasswordTokenSchema, 'query'),
  adminAuthController.getAdminResetPasswordPage,
);

router.get(
  '/resend-verification',
  // validateRequest(resendOtpSchema, 'query'),
  adminAuthController.getAdminResendVerificationPage,
);

router.post(
  '/login',
  // loginLimiter,
  // validateRequest(loginSchema),
  adminAuthController.adminLoginHandler,
);

router.post(
  '/forgot-password',
  // forgotPasswordLimiter,
  // validateRequest(forgotPasswordSchema),
  adminAuthController.adminForgotPasswordHandler,
);

router.post(
  '/resend-verification',
  // verifyLimiter,
  // validateRequest(resendOtpSchema),
  adminAuthController.adminResendOtpHandler,
);

router.post(
  '/reset-password',
  // resetPasswordLimiter,
  // validateRequest(resetPasswordSchema),
  adminAuthController.adminResetPasswordHandler,
);

router.post(
  '/logout',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.AUTHOR),
  adminAuthController.adminLogoutHandler,
);

export default router;

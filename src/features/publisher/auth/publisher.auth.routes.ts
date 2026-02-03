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

router.post('/login', validateRequest(loginSchema), publisherAuthController.publisherLoginHandler);

router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  publisherAuthController.publisherForgotPasswordHandler,
);

router.post(
  '/resend-verification',
  validateRequest(resendOtpSchema),
  publisherAuthController.publisherResendOtpHandler,
);

router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  publisherAuthController.publisherResetPasswordHandler,
);

router.post(
  '/logout',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.AUTHOR),
  publisherAuthController.publisherLogoutHandler,
);

export default router;

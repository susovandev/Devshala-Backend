import { Router } from 'express';
import publisherAuthController from './publisher.auth.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from 'validations/auth.validations.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';

const router: Router = Router();

router.get('/login', publisherAuthController.getPublisherLoginPage);

router.post('/login', validateRequest(loginSchema), publisherAuthController.publisherLoginHandler);

router.get('/forgot-password', publisherAuthController.getUserForgetPasswordPage);

router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  publisherAuthController.publisherForgotPasswordHandler,
);

router.get('/reset-password', publisherAuthController.getPublisherResetPasswordPage);

router.post(
  '/reset-password',
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

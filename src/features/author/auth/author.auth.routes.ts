import { Router } from 'express';
import authorAuthController from './author.auth.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from 'validations/auth.validations.js';

const router: Router = Router();

router.get('/login', authorAuthController.getAuthorLoginPage);

router.post('/login', validateRequest(loginSchema), authorAuthController.authorLoginHandler);

router.get('/forgot-password', authorAuthController.getAuthorForgetPasswordPage);

router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  authorAuthController.authorForgotPasswordHandler,
);

router.get('/reset-password', authorAuthController.getAuthorResetPasswordPage);

router.post(
  '/reset-password',
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

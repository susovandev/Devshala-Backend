import { Router } from 'express';
import adminAuthController from './admin.auth.controller.js';
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

router.get('/login', adminAuthController.renderAdminLoginPage);

router.post('/login', validateRequest(loginSchema), adminAuthController.adminLoginHandler);

router.get('/forgot-password', adminAuthController.renderUserForgetPasswordPage);

router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  adminAuthController.userForgotPasswordHandler,
);

router.get('/reset-password', adminAuthController.renderAdminResetPasswordPage);

router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  adminAuthController.adminResetPasswordHandler,
);

router.post(
  '/logout',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  adminAuthController.adminLogoutHandler,
);

export default router;

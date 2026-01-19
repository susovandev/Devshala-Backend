import { Router } from 'express';
import adminAuthController from './auth.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import {
  adminForgotPasswordValidationSchema,
  adminLoginValidationSchema,
  adminResetPasswordValidationSchema,
} from './admin.validations.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';

const router: Router = Router();

/**
 * @route GET /admin/auth/login
 * @description Get admin login page
 */
router.get('/auth/login', adminAuthController.getAdminLoginPage);

/**
 * @route POST /admin/auth/login
 * @description Admin login
 */
router.post(
  '/auth/login',
  validateRequest(adminLoginValidationSchema),
  adminAuthController.adminLoginHandler,
);

/**
 * @route GET /admin/auth/forgot-password
 * @description Get admin forgot password page
 */
router.get('/auth/forgot-password', adminAuthController.getAdminForgotPasswordPage);

/**
 * @route POST /admin/auth/forgot-password
 * @description Admin forgot password
 */
router.post(
  '/auth/forgot-password',
  validateRequest(adminForgotPasswordValidationSchema),
  adminAuthController.forgotPasswordHandler,
);

/**
 * @route GET /admin/auth/reset-password
 * @description Get admin reset password page
 */
router.get('/auth/reset-password', adminAuthController.getAdminResetPasswordPage);

/**
 * @route POST /admin/auth/reset-password
 * @description Admin reset password
 */
router.post(
  '/auth/reset-password',
  validateRequest(adminResetPasswordValidationSchema),
  adminAuthController.resetPasswordHandler,
);

/**
 * @route POST /admin/auth/logout
 * @description Admin logout
 */
router.post(
  '/auth/logout',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  adminAuthController.adminLogoutHandler,
);

export default router;

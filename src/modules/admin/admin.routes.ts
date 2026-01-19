import { Router } from 'express';
import adminController from './admin.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import {
  adminForgotPasswordValidationSchema,
  adminLoginValidationSchema,
  adminResetPasswordValidationSchema,
  createPublisherValidationSchema,
} from './admin.validations.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';
import AdminAuthController from './auth.controller.js';
import adminPublisherController from './publishers.controller.js';
import adminUserController from './user.controller.js';

const router: Router = Router();

/**
 * @route GET /admin/auth/login
 * @description Get admin login page
 */
router.get('/auth/login', AdminAuthController.getAdminLoginPage);

/**
 * @route POST /admin/auth/login
 * @description Admin login
 */
router.post(
  '/auth/login',
  validateRequest(adminLoginValidationSchema),
  AdminAuthController.adminLoginHandler,
);

/**
 * @route GET /admin/auth/forgot-password
 * @description Get admin forgot password page
 */
router.get('/auth/forgot-password', AdminAuthController.getAdminForgotPasswordPage);

/**
 * @route POST /admin/auth/forgot-password
 * @description Admin forgot password
 */
router.post(
  '/auth/forgot-password',
  validateRequest(adminForgotPasswordValidationSchema),
  AdminAuthController.forgotPasswordHandler,
);

/**
 * @route GET /admin/auth/reset-password
 * @description Get admin reset password page
 */
router.get('/auth/reset-password', AdminAuthController.getAdminResetPasswordPage);

/**
 * @route POST /admin/auth/reset-password
 * @description Admin reset password
 */
router.post(
  '/auth/reset-password',
  validateRequest(adminResetPasswordValidationSchema),
  AdminAuthController.resetPasswordHandler,
);

/**
 * @route GET /admin/dashboard
 * @description Admin dashboard
 */
router.get('/login', adminController.getAdminLoginPage);

/**
 * @route POST /admin/auth/logout
 * @description Admin logout
 */
router.post(
  '/auth/logout',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  AdminAuthController.adminLogoutHandler,
);

/**
 * @route GET /admin/dashboard
 * @description Admin dashboard
 */
router.get(
  '/dashboard',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  adminController.getAdminDashboardHandler,
);

/**
 * @route GET /admin/publishers
 * @description Get all publishers
 */
router.get(
  '/publishers',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  adminPublisherController.getPublishersPage,
);

/**
 * @route POST /admin/publishers
 * @description Get all publishers
 */
router.post(
  '/publishers',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  validateRequest(createPublisherValidationSchema),
  adminPublisherController.createPublisherHandler,
);

/**
 * @route POST /admin/publishers
 * @description Create publisher
 */
router.post(
  '/publishers',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  validateRequest(createPublisherValidationSchema),
  adminController.createPublisherHandler,
);

/**
 * @route PATCH /admin/users/:id/block
 * @description Block user
 */
router.patch(
  '/users/:id/block',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  adminController.blockUserHandler,
);

/**
 * @route PATCH /admin/users/:id/unblock
 * @description Unblock user
 */
router.patch(
  '/users/:id/unblock',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  adminController.unblockUserHandler,
);

/**
 * @routes GET /admin/users
 * @description Get all users
 */
router.get('/users', AuthGuardEJS, RoleGuardEJS(UserRole.ADMIN), adminUserController.getUsersPage);
export default router;

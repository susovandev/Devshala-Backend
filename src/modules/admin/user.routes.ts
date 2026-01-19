import { Router } from 'express';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';
import adminUserController from './user.controller.js';

const router: Router = Router();

/**
 * @routes GET /admin/users
 * @description Get all users
 */
router.get('/users', AuthGuardEJS, RoleGuardEJS(UserRole.ADMIN), adminUserController.getUsersPage);

/**
 * @route PATCH /admin/users/:id/block
 * @description Block user
 */
router.patch(
  '/users/:id/block',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  // adminUserController.blockUserHandler,
);

/**
 * @route PATCH /admin/users/:id/unblock
 * @description Unblock user
 */
router.patch(
  '/users/:id/unblock',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  // adminUserController.unblockUserHandler,
);

/**
 * @route PATCH /admin/users/:id/disable
 * @description Unblock user
 */
router.patch(
  '/users/:id/disable',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  // adminUserController.disableUserHandler,
);

/**
 * @route PATCH /admin/users/:id/enable
 * @description Unblock user
 */
router.patch(
  '/users/:id/enable',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  // adminUserController.enableUserHandler,
);

export default router;

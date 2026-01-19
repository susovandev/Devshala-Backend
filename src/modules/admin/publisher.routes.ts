import { Router } from 'express';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createPublisherValidationSchema } from './admin.validations.js';
import adminPublisherController from './publishers.controller.js';

const router: Router = Router();

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
 * @description Create publisher
 */
router.post(
  '/publishers',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.ADMIN),
  validateRequest(createPublisherValidationSchema),
  adminPublisherController.createPublisherHandler,
);

export default router;

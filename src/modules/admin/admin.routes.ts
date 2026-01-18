import { Router } from 'express';
import adminController from './admin.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createPublisherValidationSchema } from './admin.validations.js';
import { AuthGuard } from '@middlewares/auth.middleware.js';
import { RoleGuard } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';

const router: Router = Router();

router.use(AuthGuard);
router.use(RoleGuard(UserRole.ADMIN));

router.post(
  '/publishers',
  validateRequest(createPublisherValidationSchema),
  adminController.createPublisherHandler,
);

export default router;

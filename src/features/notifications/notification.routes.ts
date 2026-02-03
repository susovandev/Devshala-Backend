import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import notificationController from './notification.controller.js';
import { Router } from 'express';
import { UserRole } from 'models/user.model.js';

const router: Router = Router();

router.patch(
  '/authors/notifications/:id/read',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.AUTHOR),
  notificationController.markNotificationAsRead,
);

export default router;

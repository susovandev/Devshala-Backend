import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { Router } from 'express';
import { UserRole } from 'models/user.model.js';
import authorNotificationController from './author.notification.controller.js';

const router: Router = Router();

router.get('/', authorNotificationController.getAuthorNotificationsPage);

router.patch(
  '/:id/read',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.AUTHOR),
  authorNotificationController.markNotificationAsRead,
);

export default router;

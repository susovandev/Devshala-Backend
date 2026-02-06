import { Router } from 'express';
import adminNotificationController from './admin.notification.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { IdSchema } from 'validations/user.validations.js';

const router: Router = Router();

router.get('/', adminNotificationController.getAdminNotificationsPage);

router.patch(
  '/:id/read',
  validateRequest(IdSchema, 'params'),
  adminNotificationController.markNotificationAsRead,
);

export default router;

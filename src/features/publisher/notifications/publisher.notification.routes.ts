import { Router } from 'express';
import publisherNotificationController from './publisher.notification.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { IdSchema } from 'validations/user.validations.js';

const router: Router = Router();

router.get('/', publisherNotificationController.getPublisherNotificationsPage);

router.patch(
  '/:id/read',
  validateRequest(IdSchema, 'params'),
  publisherNotificationController.markNotificationAsRead,
);

export default router;

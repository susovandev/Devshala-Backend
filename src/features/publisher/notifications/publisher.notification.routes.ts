import { Router } from 'express';
import publisherNotificationController from './publisher.notification.controller.js';

const router: Router = Router();

router.get('/', publisherNotificationController.getPublisherNotificationsPage);

router.patch('/:id/read', publisherNotificationController.markNotificationAsRead);

export default router;

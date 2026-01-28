import { Router } from 'express';
import adminNotificationController from './admin.notification.controller.js';

const router: Router = Router();

router.get('/', adminNotificationController.getAdminNotificationsPage);

router.patch('/:id/read', adminNotificationController.markNotificationAsRead);

export default router;

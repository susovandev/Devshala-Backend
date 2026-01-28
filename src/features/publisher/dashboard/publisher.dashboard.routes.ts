import { Router } from 'express';
import publisherDashboardController from './publisher.dashboard.controller.js';

const router: Router = Router();

router.get('/', publisherDashboardController.getPublisherDashboard);

export default router;

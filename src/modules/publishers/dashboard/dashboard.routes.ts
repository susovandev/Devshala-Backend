import { Router } from 'express';
import publisherDashboardController from './dashboard.controller.js';

const router: Router = Router();

router.get('/', publisherDashboardController.renderPublisherDashboard);

export default router;

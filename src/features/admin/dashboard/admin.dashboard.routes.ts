import { Router } from 'express';
import adminDashboardController from './admin.dashboard.controller.js';

const router: Router = Router();

router.get('/', adminDashboardController.getAdminDashboard);

export default router;

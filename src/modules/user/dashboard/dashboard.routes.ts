import { Router } from 'express';
import userDashboardController from './dashboard.controller.js';

const router: Router = Router();

router.get('/', userDashboardController.renderUserDashboard);

export default router;

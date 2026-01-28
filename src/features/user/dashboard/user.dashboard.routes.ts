import { Router } from 'express';
import userDashboardController from './user.dashboard.controller.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';

const router: Router = Router();

router.use(AuthGuardEJS);

router.get('/', userDashboardController.getUserDashboard);

export default router;

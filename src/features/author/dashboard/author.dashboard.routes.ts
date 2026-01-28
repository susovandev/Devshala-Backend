import { Router } from 'express';
import authorDashboardController from './author.dashboard.controller.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { UserRole } from 'models/user.model.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';

const router: Router = Router();

router.use(AuthGuardEJS);
router.use(RoleGuardEJS(UserRole.AUTHOR));

router.get('/', authorDashboardController.getAuthorDashboard);

export default router;

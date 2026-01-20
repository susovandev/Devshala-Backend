import { Router } from 'express';
import userAuthRoutes from './auth/auth.routes.js';
import userProfileRoutes from './profile/profile.routes.js';
import userDashboardRoutes from './dashboard/dashboard.routes.js';
import userRepliesRoutes from './replies/replies.routes.js';
import userBookmarksRoutes from './bookmarks/bookmarks.routes.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';

const router: Router = Router();

router.use('/auth', userAuthRoutes);
router.use('/profile', AuthGuardEJS, userProfileRoutes);
router.use('/dashboard', AuthGuardEJS, userDashboardRoutes);
router.use('/replies', AuthGuardEJS, userRepliesRoutes);
router.use('/bookmarks', AuthGuardEJS, userBookmarksRoutes);

export default router;

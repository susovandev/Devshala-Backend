import { Router } from 'express';
import userAuthRoutes from './auth/user.auth.routes.js';
import userProfileRoutes from './profile/user.profile.routes.js';
import userDashboardRoutes from './dashboard/user.dashboard.routes.js';
import userBookMarksRoutes from './bookmarks/user.bookmarks.routes.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';

const userRouter: Router = Router();

userRouter.use('/auth', userAuthRoutes);

userRouter.use(AuthGuardEJS);
userRouter.use(RoleGuardEJS(UserRole.USER));

userRouter.use('/profile', userProfileRoutes);
userRouter.use('/dashboard', userDashboardRoutes);
userRouter.use('/bookmarks', userBookMarksRoutes);

export { userRouter };

// import { Router } from 'express';
// import publisherController from './publisher.controller.js';
// import { validateRequest } from '@middlewares/validation.middleware.js';
// import {
//   publisherForgotPasswordValidationSchema,
//   publisherLoginValidationSchema,
//   publisherResetPasswordValidationSchema,
// } from './publisher.validations.js';

// const router = Router();

// /**
//  * @route GET /publishers/auth/login
//  * @description Get publisher login page
//  */
// router.get('/auth/login', publisherController.getPublisherLoginPage);

// /**
//  * @route POST /publishers/auth/login
//  * @description Publisher login
//  */
// router.post(
//   '/auth/login',
//   validateRequest(publisherLoginValidationSchema),
//   publisherController.publisherLoginHandler,
// );

// /**
//  * @route GET /admin/auth/forgot-password
//  * @description Get admin forgot password page
//  */
// router.get('/auth/forgot-password', publisherController.getPublisherForgotPasswordPage);

// /**
//  * @route POST /admin/auth/forgot-password
//  * @description Admin forgot password
//  */
// router.post(
//   '/auth/forgot-password',
//   validateRequest(publisherForgotPasswordValidationSchema),
//   publisherController.publisherForgotPasswordHandler,
// );

// /**
//  * @route GET /admin/auth/reset-password
//  * @description Get admin reset password page
//  */
// router.get('/auth/reset-password', publisherController.getPublisherResetPasswordPage);

// /**
//  * @route POST /admin/auth/reset-password
//  * @description Admin reset password
//  */
// router.post(
//   '/auth/reset-password',
//   validateRequest(publisherResetPasswordValidationSchema),
//   publisherController.publisherResetPasswordHandler,
// );

// router.use('/');

// export default router;

import publisherProfileRoutes from './profile/profile.routes.js';
import publisherDashboardRoutes from './dashboard/dashboard.routes.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { Router } from 'express';
import { UserRole } from 'models/user.model.js';

const router: Router = Router();

router.use('/auth', publisherAuthRoutes);
router.use('/profile', AuthGuardEJS, RoleGuardEJS(UserRole.PUBLISHER), publisherProfileRoutes);
router.use('/categories', AuthGuardEJS, RoleGuardEJS(UserRole.PUBLISHER), publisherProfileRoutes);
router.use('/dashboard', AuthGuardEJS, RoleGuardEJS(UserRole.PUBLISHER), publisherDashboardRoutes);

export default router;

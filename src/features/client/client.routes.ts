import { Router } from 'express';
import clientController from './client.controller.js';
import { AttachCurrentUser, AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { UserRole } from 'models/user.model.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { IdSchema } from 'validations/user.validations.js';

const clientRoutes: Router = Router();

clientRoutes.get('/', AttachCurrentUser, clientController.getIndexPage);
clientRoutes.get('/about', AttachCurrentUser, clientController.getAboutPage);

// BLOGS
clientRoutes.get(
  '/blogs/:id',
  validateRequest(IdSchema, 'params'),
  AttachCurrentUser,
  clientController.getBlogDetailsPage,
);
clientRoutes.post(
  '/blogs/:id/like',
  validateRequest(IdSchema, 'params'),
  AuthGuardEJS,
  clientController.toggleLikeController,
);
clientRoutes.post(
  '/blogs/:id/bookmark',
  validateRequest(IdSchema, 'params'),
  AuthGuardEJS,
  clientController.toggleBookmarkController,
);
clientRoutes.post(
  '/blogs/:id/comments',
  validateRequest(IdSchema, 'params'),
  AuthGuardEJS,
  clientController.postCommentController,
);
clientRoutes.post(
  '/blogs/:id/views',
  validateRequest(IdSchema, 'params'),
  AttachCurrentUser,
  clientController.handleBlogView,
);

clientRoutes.post(
  '/ai/blog-summary/:id',
  validateRequest(IdSchema, 'params'),
  AttachCurrentUser,
  clientController.generateBlogSummary,
);

// AUTHOR REQUEST
clientRoutes.get(
  '/authors/request',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.USER),
  clientController.getAuthorRequestPage,
);

clientRoutes.post(
  '/authors/request',
  AuthGuardEJS,
  RoleGuardEJS(UserRole.USER),
  clientController.createAuthorRequestHandler,
);

// SUBSCRIBER
clientRoutes.post('/subscribe', clientController.subscribeHandler);

// Support
clientRoutes.get('/support', AttachCurrentUser, clientController.getSupportPage);
clientRoutes.get('/support/account', AttachCurrentUser, clientController.getAccountSupportPage);
clientRoutes.get(
  '/auth/forgot-password',
  AttachCurrentUser,
  clientController.getForgotPasswordPage,
);

clientRoutes.get(
  '/auth/resend-verification',
  AttachCurrentUser,
  clientController.getResendVerificationPage,
);

clientRoutes.get('/support/email-change', AttachCurrentUser, clientController.getEmailChangePage);
clientRoutes.get('/support/account-lock', AttachCurrentUser, clientController.getAccountLockPage);

export { clientRoutes };

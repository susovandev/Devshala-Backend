import { Router } from 'express';
import clientController from './client.controller.js';
import { AttachCurrentUser, AuthGuardEJS, OptionalAuthEJS } from '@middlewares/auth.middleware.js';
import { UserRole } from 'models/user.model.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';

const clientRoutes: Router = Router();

clientRoutes.get('/', AttachCurrentUser, clientController.getIndexPage);
clientRoutes.get('/about', clientController.getAboutPage);

// BLOGS
clientRoutes.get('/blogs/:id', OptionalAuthEJS, clientController.getBlogDetailsPage);
clientRoutes.post('/blogs/:id/like', AuthGuardEJS, clientController.toggleLikeController);
clientRoutes.post('/blogs/:id/bookmark', AuthGuardEJS, clientController.toggleBookmarkController);
clientRoutes.post('/blogs/:id/comments', AuthGuardEJS, clientController.postCommentController);

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

export { clientRoutes };

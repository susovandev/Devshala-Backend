import { Router } from 'express';
import bookmarksController from './user.bookmarks.controller.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { IdSchema } from 'validations/user.validations.js';

const router: Router = Router();

router.use(AuthGuardEJS);

router.get('/', bookmarksController.getBookmarksPage);
router.delete(
  '/:id/delete',
  validateRequest(IdSchema, 'params'),
  bookmarksController.deleteBookmarkHandler,
);

export default router;

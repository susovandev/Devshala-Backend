import { Router } from 'express';
import bookmarksController from './user.bookmarks.controller.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';

const router: Router = Router();

router.use(AuthGuardEJS);
router.get('/', bookmarksController.getBookmarksPage);
router.delete('/:id/delete', bookmarksController.deleteBookmarkHandler);

export default router;

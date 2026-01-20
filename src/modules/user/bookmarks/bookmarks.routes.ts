import { Router } from 'express';
import userBookmarksController from './bookmarks.controller.js';

const router: Router = Router();

router.get('/', userBookmarksController.renderUserBookmarksPage);

export default router;

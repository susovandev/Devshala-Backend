import { Router } from 'express';
import adminCommentController from './admin.comment.controller.js';

const router: Router = Router();

router.get('/', adminCommentController.getCommentsPage);

export default router;

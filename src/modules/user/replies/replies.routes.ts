import { Router } from 'express';
import userRepliesController from './replies.controller.js';

const router: Router = Router();

router.get('/', userRepliesController.renderUserRepliesPage);

export default router;

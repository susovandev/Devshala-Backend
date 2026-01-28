import { Router } from 'express';
import repliesController from './replies.controller.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';

const router: Router = Router();

router.use(AuthGuardEJS);
router.get('/', repliesController.getRepliesPage);

export default router;

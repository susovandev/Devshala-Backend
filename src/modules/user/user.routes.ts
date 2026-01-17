import { Router } from 'express';
import userController from './user.controller.js';
import { AuthGuard } from '@middlewares/auth.middleware.js';

const router: Router = Router();

router.get('/profile', AuthGuard, userController.getUserProfileHandler);

export default router;

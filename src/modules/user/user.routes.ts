import { Router } from 'express';
import userController from './user.controller.js';
import { AuthGuard } from '@middlewares/auth.middleware.js';
import { upload } from '@config/multer.js';

const router: Router = Router();

router.get('/profile', AuthGuard, userController.getUserProfileHandler);
router.put(
  '/profile/update',
  AuthGuard,
  upload.single('avatar'),
  userController.updateUserProfileHandler,
);
router.put('/profile/update-password', AuthGuard, userController.updateUserPasswordHandler);

export default router;

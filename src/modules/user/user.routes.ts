/*
import { Router } from 'express';
// import userController from './user.controller.js';
import { AuthGuard } from '@middlewares/auth.middleware.js';
import { upload } from '@config/multer.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { updateUserPasswordSchema, updateUserProfileSchema } from './user.validation.js';

const router: Router = Router();

router.use(AuthGuard);

router.get('/profile', userController.getUserProfileHandler);
router.put(
  '/profile/update',
  upload.single('avatar'),
  validateRequest(updateUserProfileSchema),
  userController.updateUserProfileHandler,
);
router.put(
  '/profile/update-password',
  validateRequest(updateUserPasswordSchema),
  userController.updateUserPasswordHandler,
);

export default router;
*/

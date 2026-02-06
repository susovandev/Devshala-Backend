import { Router } from 'express';
import userProfileController from './user.profile.controller.js';
import { upload } from '@config/multer.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { changePasswordSchema } from 'validations/auth.validations.js';
import { updateProfileSchema } from 'validations/user.validations.js';
import { changePasswordLimiter } from '@middlewares/rateLimit/changePasswordLimiter.js';
import { updateProfileLimiter } from '@middlewares/rateLimit/updateProfileLimiter.js';

const router: Router = Router();

router.get('/', userProfileController.getUserProfilePage);

router.get('/change-password', userProfileController.getChangePasswordPage);

router.post(
  '/change-password',
  changePasswordLimiter,
  validateRequest(changePasswordSchema),
  userProfileController.changePasswordHandler,
);

router.post(
  '/avatar',
  updateProfileLimiter,
  upload.single('avatar'),
  userProfileController.updateUserAvatarHandler,
);

router.post(
  '/',
  updateProfileLimiter,
  validateRequest(updateProfileSchema),
  userProfileController.updateUserProfileHandler,
);

export default router;

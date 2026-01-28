import { Router } from 'express';
import userProfileController from './user.profile.controller.js';
import { upload } from '@config/multer.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { changePasswordSchema } from 'validations/auth.validations.js';

const router: Router = Router();

router.get('/', userProfileController.getUserProfilePage);

router.get('/change-password', userProfileController.getChangePasswordPage);

router.post(
  '/change-password',
  validateRequest(changePasswordSchema),
  userProfileController.changePasswordHandler,
);

router.post('/avatar', upload.single('avatar'), userProfileController.updateUserAvatarHandler);

router.post('/', userProfileController.updateUserProfileHandler);

export default router;

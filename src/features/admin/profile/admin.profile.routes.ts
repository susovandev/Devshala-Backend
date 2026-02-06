import { Router } from 'express';
import adminProfileController from './admin.profile.controller.js';
import { upload } from '@config/multer.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { changePasswordSchema } from 'validations/auth.validations.js';
import { changePasswordLimiter } from '@middlewares/rateLimit/changePasswordLimiter.js';
import { updateProfileLimiter } from '@middlewares/rateLimit/updateProfileLimiter.js';

const router: Router = Router();

router.get('/', adminProfileController.getAdminProfilePage);
router.get('/change-password', adminProfileController.getChangePasswordPage);

router.post(
  '/change-password',
  changePasswordLimiter,
  validateRequest(changePasswordSchema),
  adminProfileController.changePasswordHandler,
);

router.post(
  '/avatar',
  updateProfileLimiter,
  upload.single('avatar'),
  adminProfileController.updateAdminAvatarHandler,
);

router.post('/', updateProfileLimiter, adminProfileController.updateAdminProfileHandler);

export default router;

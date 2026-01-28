import { Router } from 'express';
import adminProfileController from './admin.profile.controller.js';
import { upload } from '@config/multer.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { changePasswordSchema } from 'validations/auth.validations.js';

const router: Router = Router();

router.get('/', adminProfileController.getAdminProfilePage);
router.get('/change-password', adminProfileController.getChangePasswordPage);

router.post(
  '/change-password',
  validateRequest(changePasswordSchema),
  adminProfileController.changePasswordHandler,
);

router.post('/avatar', upload.single('avatar'), adminProfileController.updateAdminAvatarHandler);

router.post('/', adminProfileController.updateAdminProfileHandler);

export default router;

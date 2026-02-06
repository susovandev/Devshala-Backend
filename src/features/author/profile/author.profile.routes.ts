import { Router } from 'express';
import authorProfileController from './author.profile.controller.js';
import { upload } from '@config/multer.js';
import { updateProfileLimiter } from '@middlewares/rateLimit/updateProfileLimiter.js';

const router: Router = Router();

router.get('/', authorProfileController.getAuthorProfilePage);
router.get('/change-password', authorProfileController.getAuthorChangePasswordPage);

router.post(
  '/avatar',
  updateProfileLimiter,
  upload.single('avatar'),
  authorProfileController.updateAuthorAvatarHandler,
);

router.post('/', updateProfileLimiter, authorProfileController.updateAuthorProfileHandler);

router.post('/change-password', authorProfileController.changePasswordHandler);

export default router;

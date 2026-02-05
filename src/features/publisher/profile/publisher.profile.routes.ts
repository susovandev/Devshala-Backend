import { Router } from 'express';
import publisherProfileController from './publisher.profile.controller.js';
import { upload } from '@config/multer.js';
import { updateProfileLimiter } from '@middlewares/rateLimit/updateProfileLimiter.js';

const router: Router = Router();

router.get('/', publisherProfileController.getPublisherProfilePage);

router.post(
  '/avatar',
  updateProfileLimiter,
  upload.single('avatar'),
  publisherProfileController.updatePublisherAvatarHandler,
);

router.post('/', updateProfileLimiter, publisherProfileController.updatePublisherProfileHandler);
export default router;

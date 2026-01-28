import { Router } from 'express';
import publisherProfileController from './publisher.profile.controller.js';
import { upload } from '@config/multer.js';

const router: Router = Router();

router.get('/', publisherProfileController.getPublisherProfilePage);

router.post(
  '/avatar',
  upload.single('avatar'),
  publisherProfileController.updatePublisherAvatarHandler,
);

router.post('/', publisherProfileController.updatePublisherProfileHandler);
export default router;

import { Router } from 'express';
import publisherProfileController from './profile.controller.js';
import { upload } from '@config/multer.js';

const router: Router = Router();

/**
 * @routes GET /publishers/profile
 * @description Get publisher profile page
 */
router.get('/', publisherProfileController.renderPublisherProfilePage);

/**
 * @routes PATCH /publishers/profile/avatar
 * @description Update publisher avatar
 */
router.post(
  '/avatar',
  upload.single('avatar'),
  publisherProfileController.updatePublisherAvatarHandler,
);

/**
 * @routes POST /publishers/profile
 * @description Update publisher profile
 */
router.post('/', publisherProfileController.updatePublisherProfileHandler);

/**
 * @routes GET /publishers/auth/change-password
 * @description Get publisher change-password page
 */
router.get('/change-password', publisherProfileController.renderPublisherChangePasswordPage);

/**
 * @routes POST /publishers/auth/change-password
 * @description publisher change-password
 */
router.post('/change-password', publisherProfileController.publisherChangePasswordHandler);

export default router;

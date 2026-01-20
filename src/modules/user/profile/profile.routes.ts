import { Router } from 'express';
import userProfileController from './profile.controller.js';
import { upload } from '@config/multer.js';

const router: Router = Router();

/**
 * @routes GET /users/profile
 * @description Get user profile page
 */
router.get('/', userProfileController.renderUserProfilePage);

/**
 * @routes PATCH /users/profile/avatar
 * @description Update user avatar
 */
router.post('/avatar', upload.single('avatar'), userProfileController.updateUserAvatarHandler);

/**
 * @routes POST /users/profile
 * @description Update user profile
 */
router.post('/', userProfileController.updateUserProfileHandler);

export default router;

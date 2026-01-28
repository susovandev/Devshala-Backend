import { Router } from 'express';
import authorProfileController from './author.profile.controller.js';
import { upload } from '@config/multer.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';

const router: Router = Router();

router.use(AuthGuardEJS);
router.use(RoleGuardEJS(UserRole.AUTHOR));

router.get('/', authorProfileController.getAuthorProfilePage);
router.get('/password', authorProfileController.getAuthorChangePasswordPage);

router.post('/avatar', upload.single('avatar'), authorProfileController.updateAuthorAvatarHandler);

router.post('/', authorProfileController.updateAuthorProfileHandler);

export default router;

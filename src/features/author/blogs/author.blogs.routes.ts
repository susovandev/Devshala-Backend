import { Router } from 'express';
import authorBlogsController from './author.blogs.controller.js';
import { AuthGuardEJS } from '@middlewares/auth.middleware.js';
import { RoleGuardEJS } from '@middlewares/roleGuard.middleware.js';
import { UserRole } from 'models/user.model.js';
import { upload } from '@config/multer.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createBlogSchema, updateBlogSchema } from 'validations/blog.validations.js';

const router: Router = Router();

router.use(AuthGuardEJS);
router.use(RoleGuardEJS(UserRole.AUTHOR));

router.get('/', authorBlogsController.getAuthorBlogsPage);

router.get('/create', authorBlogsController.getAuthorCreateBlogPage);

router.post(
  '/create',
  upload.single('coverImage'),
  validateRequest(createBlogSchema),
  authorBlogsController.createBlogHandler,
);

router.put(
  '/update',
  upload.single('coverImage'),
  validateRequest(updateBlogSchema),
  authorBlogsController.updateBlogHandler,
);

export default router;

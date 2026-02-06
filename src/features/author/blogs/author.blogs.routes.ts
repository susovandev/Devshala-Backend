import { Router } from 'express';
import authorBlogsController from './author.blogs.controller.js';
import { upload } from '@config/multer.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createBlogSchema, updateBlogSchema } from 'validations/blog.validations.js';

const router: Router = Router();

router.get('/', authorBlogsController.getAuthorBlogsPage);

router.get('/create', authorBlogsController.getAuthorCreateBlogPage);

router.get('/:id/edit', authorBlogsController.getAuthEditBlogPage);

router.post(
  '/create',
  upload.single('coverImage'),
  // validateRequest(createBlogSchema),
  authorBlogsController.createBlogHandler,
);

router.put(
  '/:id/edit',
  upload.single('coverImage'),
  // validateRequest(updateBlogSchema),
  authorBlogsController.updateBlogHandler,
);

export default router;

import { Router } from 'express';
import adminBlogController from './admin.blog.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createBlogSchema, updateBlogSchema } from 'validations/blog.validations.js';
import { upload } from '@config/multer.js';

const router: Router = Router();

router.get('/', adminBlogController.getAdminBlogPage);

router.get('/create', adminBlogController.getAdminCreateBlogPage);

router.get('/:id/edit', adminBlogController.getAdminBlogUpdatePage);

router.post(
  '/create',
  upload.single('coverImage'),
  validateRequest(createBlogSchema),
  adminBlogController.createBlogHandler,
);

router.patch('/:id/approval', adminBlogController.approveBlogHandlerByAdmin);

router.put(
  '/update',
  upload.single('coverImage'),
  validateRequest(updateBlogSchema),
  adminBlogController.updateBlogHandler,
);

router.put('/:id/edit', upload.single('coverImage'), adminBlogController.updateBlogHandler);

router.delete('/:id', adminBlogController.deleteBlogHandler);

export default router;

import { Router } from 'express';
import adminBlogController from './admin.blog.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createBlogSchema, updateBlogSchema } from 'validations/blog.validations.js';
import { upload } from '@config/multer.js';
import { IdSchema } from 'validations/user.validations.js';
import { updateProfileLimiter } from '@middlewares/rateLimit/updateProfileLimiter.js';

const router: Router = Router();

router.get('/', adminBlogController.getAdminBlogPage);

router.get('/create', adminBlogController.getAdminCreateBlogPage);

router.get(
  '/:id/edit',
  validateRequest(IdSchema, 'params'),
  adminBlogController.getAdminBlogUpdatePage,
);

router.post(
  '/create',
  upload.single('coverImage'),
  validateRequest(createBlogSchema),
  adminBlogController.createBlogHandler,
);

router.patch(
  '/:id/approval',
  validateRequest(IdSchema, 'params'),
  adminBlogController.approveBlogHandlerByAdmin,
);

router.put(
  '/update',
  updateProfileLimiter,
  upload.single('coverImage'),
  validateRequest(updateBlogSchema),
  adminBlogController.updateBlogHandler,
);

router.put(
  '/:id/edit',
  updateProfileLimiter,
  validateRequest(IdSchema, 'params'),
  upload.single('coverImage'),
  adminBlogController.updateBlogHandler,
);

router.delete('/:id', validateRequest(IdSchema, 'params'), adminBlogController.deleteBlogHandler);

export default router;

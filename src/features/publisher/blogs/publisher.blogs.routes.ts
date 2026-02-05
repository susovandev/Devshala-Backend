import { Router } from 'express';
import publisherBlogsController from './publisher.blogs.controller.js';
import { upload } from '@config/multer.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { IdSchema } from 'validations/user.validations.js';

const router: Router = Router();

router.get('/', publisherBlogsController.getPublisherBlogsPage);

router.get(
  '/:id/edit',
  validateRequest(IdSchema, 'params'),
  publisherBlogsController.getPublisherBlogUpdatePage,
);

router.patch(
  '/:id/approval',
  validateRequest(IdSchema, 'params'),
  publisherBlogsController.approveBlogHandlerByPublisher,
);

router.put(
  '/:id/edit',
  validateRequest(IdSchema, 'params'),
  upload.single('coverImage'),
  publisherBlogsController.updateBlogHandler,
);

export default router;

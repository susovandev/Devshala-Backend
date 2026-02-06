import { Router } from 'express';
import publisherBlogsController from './publisher.blogs.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { IdSchema } from 'validations/user.validations.js';

const router: Router = Router();

router.get('/', publisherBlogsController.getPublisherBlogsPage);

router.patch(
  '/:id/approval',
  validateRequest(IdSchema, 'params'),
  publisherBlogsController.approveBlogHandlerByPublisher,
);

export default router;

import { Router } from 'express';
import publisherAdminController from './publisher.author.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createUserSchema, reasonSchema, userIdParam } from 'validations/user.validations.js';

const router: Router = Router();

router.get('/', publisherAdminController.getAuthorsPage);
router.post(
  '/create',
  validateRequest(createUserSchema),
  publisherAdminController.createAuthorHandler,
);

router.post(
  '/:id/block',
  validateRequest(userIdParam, 'params'),
  validateRequest(reasonSchema),
  publisherAdminController.blockAuthorAccountHandler,
);
router.post(
  '/:id/activate',
  validateRequest(userIdParam, 'params'),
  publisherAdminController.activeAuthorAccountHandler,
);
router.post(
  '/:id/disable',
  validateRequest(userIdParam, 'params'),
  validateRequest(reasonSchema),
  publisherAdminController.disableAuthorAccountHandler,
);

export default router;

import { Router } from 'express';
import publisherAdminController from './publisher.author.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createUserSchema, reasonSchema, IdSchema } from 'validations/user.validations.js';

const router: Router = Router();

router.get('/', publisherAdminController.getAuthorsPage);

router.post(
  '/create',
  // validateRequest(createUserSchema),
  publisherAdminController.createAuthorHandler,
);

router.post(
  '/:id/block',
  // validateRequest(IdSchema, 'params'),
  // validateRequest(reasonSchema),
  publisherAdminController.blockAuthorAccountHandler,
);

router.post(
  '/:id/activate',
  // validateRequest(IdSchema, 'params'),
  publisherAdminController.activeAuthorAccountHandler,
);

router.post(
  '/:id/disable',
  // validateRequest(IdSchema, 'params'),
  // validateRequest(reasonSchema),
  publisherAdminController.disableAuthorAccountHandler,
);

export default router;

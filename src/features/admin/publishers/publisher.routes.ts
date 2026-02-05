import { Router } from 'express';
import adminPublisherController from './publisher.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createUserSchema, IdSchema, reasonSchema } from 'validations/user.validations.js';

const router: Router = Router();

router.get('/', adminPublisherController.getPublisherPage);
router.post(
  '/',
  validateRequest(createUserSchema),
  adminPublisherController.createPublisherHandler,
);

router.post(
  '/:id/block',
  validateRequest(IdSchema, 'params'),
  validateRequest(reasonSchema),
  adminPublisherController.blockPublisherAccountHandler,
);
router.post(
  '/:id/activate',
  validateRequest(IdSchema, 'params'),
  adminPublisherController.activePublisherAccountHandler,
);
router.post(
  '/:id/disable',
  validateRequest(IdSchema, 'params'),
  validateRequest(reasonSchema),
  adminPublisherController.disablePublisherAccountHandler,
);

export default router;

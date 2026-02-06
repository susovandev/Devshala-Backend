import { Router } from 'express';
import adminUserController from './admin.user.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { IdSchema } from 'validations/user.validations.js';

const router = Router();

router.get('/', adminUserController.getUsersPage);

router.post(
  '/:id/block',
  validateRequest(IdSchema, 'params'),
  adminUserController.blockUserAccountHandler,
);
router.post(
  '/:id/activate',
  validateRequest(IdSchema, 'params'),
  adminUserController.activeUserAccountHandler,
);
router.post(
  '/:id/disable',
  validateRequest(IdSchema, 'params'),
  adminUserController.disableUserAccountHandler,
);

export default router;

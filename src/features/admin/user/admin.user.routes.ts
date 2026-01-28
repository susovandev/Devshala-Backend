import { Router } from 'express';
import adminUserController from './admin.user.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { userIdParam } from 'validations/user.validations.js';

const router = Router();

router.get('/', adminUserController.getUsersPage);

router.post(
  '/:id/block',
  validateRequest(userIdParam, 'params'),
  adminUserController.blockUserAccountHandler,
);
router.post(
  '/:id/activate',
  validateRequest(userIdParam, 'params'),
  adminUserController.activeUserAccountHandler,
);
router.post(
  '/:id/disable',
  validateRequest(userIdParam, 'params'),
  adminUserController.disableUserAccountHandler,
);

export default router;

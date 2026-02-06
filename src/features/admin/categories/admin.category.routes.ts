import { Router } from 'express';
import adminCategoryController from './admin.category.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { createCategorySchema, updateCategorySchema } from 'validations/category.validations.js';
import { IdSchema } from 'validations/user.validations.js';

const router: Router = Router();

router.get('/', adminCategoryController.getCategoryPage);
router.post(
  '/',
  validateRequest(createCategorySchema),
  adminCategoryController.createCategoryHandler,
);

router.put(
  '/:id',
  validateRequest(IdSchema, 'params'),
  validateRequest(updateCategorySchema),
  adminCategoryController.updateCategoryController,
);

router.delete(
  '/:id',
  validateRequest(IdSchema, 'params'),
  adminCategoryController.deleteCategoryHandler,
);

export default router;

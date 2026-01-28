import { Router } from 'express';
import adminCategoryController from './admin.category.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import {
  categoryIdParam,
  createCategorySchema,
  updateCategorySchema,
} from 'validations/category.validations.js';

const router: Router = Router();

router.get('/', adminCategoryController.getCategoryPage);
router.post(
  '/',
  validateRequest(createCategorySchema),
  adminCategoryController.createCategoryHandler,
);

router.put(
  '/:id',
  validateRequest(categoryIdParam, 'params'),
  validateRequest(updateCategorySchema),
  adminCategoryController.updateCategoryController,
);

router.delete(
  '/:id',
  validateRequest(categoryIdParam, 'params'),
  adminCategoryController.deleteCategoryHandler,
);

export default router;

import { Router } from 'express';
import publisherCategoryController from './publisher.category.controller.js';
import { categoryIdParam } from 'validations/category.validations.js';
import { validateRequest } from '@middlewares/validation.middleware.js';

const router: Router = Router();

router.get('/', publisherCategoryController.getCategoryPage);
router.post('/', publisherCategoryController.createCategoryHandler);

router.put(
  '/:id',
  validateRequest(categoryIdParam, 'params'),
  publisherCategoryController.updateCategoryController,
);

router.delete(
  '/:id',
  validateRequest(categoryIdParam, 'params'),
  publisherCategoryController.deleteCategoryHandler,
);

export default router;

import { Router } from 'express';
import publisherCategoryController from './publisher.category.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { IdSchema } from 'validations/user.validations.js';

const router: Router = Router();

router.get('/', publisherCategoryController.getCategoryPage);
router.post('/', publisherCategoryController.createCategoryHandler);

router.put(
  '/:id',
  validateRequest(IdSchema, 'params'),
  publisherCategoryController.updateCategoryController,
);

router.delete(
  '/:id',
  validateRequest(IdSchema, 'params'),
  publisherCategoryController.deleteCategoryHandler,
);

export default router;

import { Router } from 'express';
import publisherCategoryController from './category.controller.js';

const router: Router = Router();

/**
 * @route GET /publishers/categories
 * @description Get publisher login page
 */
router.get('/', publisherCategoryController.renderCategoriesPage);

export default router;

import { Router } from 'express';
import frontendController from './frontend.controller.js';

const router: Router = Router();

/**
 * @route GET /
 * @description Get frontend index page
 */
router.get('/', frontendController.renderHomePage);

/**
 * @route GET /blog-details/:id'
 * @description Get frontend index page
 */
router.get('/blogs/blog-details', frontendController.renderBlogDetailsPage);

export default router;

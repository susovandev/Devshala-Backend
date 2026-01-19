import { Router } from 'express';
import frontendController from './frontend.controller.js';

const router: Router = Router();

/**
 * @route GET /home
 * @description Get frontend index page
 */

router.get('/', frontendController.renderHomePage);

export default router;

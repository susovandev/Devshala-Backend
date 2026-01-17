import { Router } from 'express';
import authController from './auth.controller.js';

const router: Router = Router();

router.post('/signup', authController.signupHandler);
router.post('/verify-email', authController.verifyEmailHandler);
router.post('/signin', authController.loginHandler);

export default router;

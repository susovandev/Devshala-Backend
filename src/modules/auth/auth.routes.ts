import { Router } from 'express';
import authController from './auth.controller.js';
import { AuthGuard } from '@middlewares/auth.middleware.js';

const router: Router = Router();

router.post('/signup', authController.signupHandler);
router.post('/verify-email', authController.verifyEmailHandler);
router.post('/resend-verify-email', authController.resendVerificationEmailHandler);
router.post('/signin', authController.loginHandler);
router.post('/logout', AuthGuard, authController.logoutHandler);

export default router;

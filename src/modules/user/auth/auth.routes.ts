import { Router } from 'express';
import { validateRequest } from '@middlewares/validation.middleware.js';
import {
  userForgotPasswordValidationSchema,
  userLoginValidationSchema,
  userRegisterValidationSchema,
  userResetPasswordValidationSchema,
} from './auth.validations.js';
import userAuthController from './auth.controller.js';

const router: Router = Router();

/**
 * @routes GET /users/auth/register
 * @description Get user register page
 */
router.get('/register', userAuthController.renderUserRegisterPage);

/**
 * @routes POST /users/auth/register
 * @description User register Handler
 */
router.post(
  '/register',
  validateRequest(userRegisterValidationSchema),
  userAuthController.userRegisterHandler,
);

/**
 * @routes GET /users/auth/verify-otp
 * @description Get user verify otp page
 */
router.get('/verify-otp', userAuthController.renderUserVerifyOtpPage);

/**
 * @routes POST /users/auth/verify-otp
 * @description User verify otp Handler
 */
router.post('/verify-otp', userAuthController.userVerifyOtpHandler);

/**
 * @routes GET /users/auth/login
 * @description Get user login page
 */
router.get('/login', userAuthController.renderUserLoginPage);

/**
 * @routes POST /users/auth/login
 * @description User login Handler
 */
router.post(
  '/login',
  validateRequest(userLoginValidationSchema),
  userAuthController.userLoginHandler,
);

/**
 * @routes GET /users/auth/forgot-password
 * @description Get user forgot-password page
 */
router.get('/forgot-password', userAuthController.renderUserForgetPasswordPage);

/**
 * @routes POST /users/auth/forgot-password
 * @description User forgot-password Handler
 */
router.post(
  '/forgot-password',
  validateRequest(userForgotPasswordValidationSchema),
  userAuthController.userForgotPasswordHandler,
);

/**
 * @routes GET /users/auth/reset-password
 * @description Get user reset-password page
 */
router.get('/reset-password', userAuthController.renderUserResetPasswordPage);

/**
 * @routes POST /users/auth/reset-password
 * @description User reset-password Handler
 */
router.post(
  '/reset-password',
  validateRequest(userResetPasswordValidationSchema),
  userAuthController.userResetPasswordHandler,
);

/**
 * @routes POST /users/auth/logout
 * @description User logout
 */
router.get('/logout', userAuthController.userLogoutHandler);

export default router;

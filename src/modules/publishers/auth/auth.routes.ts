// import { Router } from 'express';
// // import { validateRequest } from '@middlewares/validation.middleware.js';
// // import publisherAuthController from './auth.controller.js';
// // import { AuthGuard } from '@middlewares/auth.middleware.js';

// const router: Router = Router();

// /**
//  * @routes GET /publishers/auth/register
//  * @description Get publisher register page
//  */
// router.get('/register', publisherAuthController.renderPublisherRegisterPage);

// /**
//  * @routes POST /publishers/auth/register
//  * @description publisher register Handler
//  */
// router.post(
//   '/register',
//   // validateRequest(publisherRegisterValidationSchema),
//   publisherAuthController.publisherRegisterHandler,
// );

// /**
//  * @routes GET /publishers/auth/verify-otp
//  * @description Get publisher verify otp page
//  */
// router.get('/verify-otp', publisherAuthController.renderPublisherVerifyOtpPage);

// /**
//  * @routes POST /publishers/auth/verify-otp
//  * @description publisher verify otp Handler
//  */
// router.post('/verify-otp', publisherAuthController.publisherVerifyOtpHandler);

// /**
//  * @routes GET /publishers/auth/resend-otp
//  * @description Get publisher resend otp page
//  */
// router.get('/resend-otp', publisherAuthController.renderPublisherResendOtpPage);

// /**
//  * @routes POST /publishers/auth/resend-otp
//  * @description publisher resend otp Handler
//  */
// router.post('/resend-otp', publisherAuthController.publisherResendOtpHandler);

// /**
//  * @routes GET /publishers/auth/login
//  * @description Get publisher login page
//  */
// router.get('/login', publisherAuthController.renderPublisherLoginPage);

// /**
//  * @routes POST /publishers/auth/login
//  * @description publisher login Handler
//  */
// router.post(
//   '/login',
//   // validateRequest(publisherLoginValidationSchema),
//   publisherAuthController.publisherLoginHandler,
// );

// /**
//  * @routes GET /publishers/auth/forgot-password
//  * @description Get publisher forgot-password page
//  */
// router.get('/forgot-password', publisherAuthController.renderPublisherForgetPasswordPage);

// /**
//  * @routes POST /publishers/auth/forgot-password
//  * @description publisher forgot-password Handler
//  */
// router.post(
//   '/forgot-password',
//   // validateRequest(publisherForgotPasswordValidationSchema),
//   publisherAuthController.publisherForgotPasswordHandler,
// );

// /**
//  * @routes GET /publishers/auth/reset-password
//  * @description Get publisher reset-password page
//  */
// router.get('/reset-password', publisherAuthController.renderPublisherResetPasswordPage);

// /**
//  * @routes POST /publishers/auth/reset-password
//  * @description publisher reset-password Handler
//  */
// router.post(
//   '/reset-password',
//   // validateRequest(publisherResetPasswordValidationSchema),
//   publisherAuthController.publisherResetPasswordHandler,
// );

// /**
//  * @routes POST /publishers/auth/logout
//  * @description publisher logout
//  */
// router.post('/logout', AuthGuard, publisherAuthController.publisherLogoutHandler);

// export default router;

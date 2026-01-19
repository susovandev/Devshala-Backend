import { z } from 'zod';

export const createPublisherValidationSchema = z.object({
  username: z.string({ message: 'Username is required' }),
  email: z.string({ message: 'Email is required' }).email(),
});

export type TCreatePublisherRequestBody = z.infer<typeof createPublisherValidationSchema>;

export const blockUserValidationSchema = z.object({
  reason: z
    .string({ message: 'Reason is required' })
    .min(10, 'Reason must be at least 10 characters long'),
});

export type TBlockUserRequestBody = z.infer<typeof blockUserValidationSchema>;

export const userIdValidationSchema = z.object({
  id: z.string({ message: 'User ID is required' }),
});

export type TUserIdRequestParam = z.infer<typeof userIdValidationSchema>;

export const adminLoginValidationSchema = z.object({
  email: z.string({ message: 'Email is required' }).email(),
  password: z.string({ message: 'Password is required' }),
});

export type TAdminLoginRequestBody = z.infer<typeof adminLoginValidationSchema>;

export const adminForgotPasswordValidationSchema = z.object({
  email: z.string({ message: 'Email is required' }).email(),
});

export type TAdminForgotPasswordRequestBody = z.infer<typeof adminForgotPasswordValidationSchema>;

export const adminResetPasswordValidationSchema = z.object({
  token: z.string({ message: 'Token is required' }),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z
    .string({ message: 'Confirm password is required' })
    .min(8, 'Password must be at least 8 characters long'),
});

export type TAdminResetPasswordRequestBody = z.infer<typeof adminResetPasswordValidationSchema>;

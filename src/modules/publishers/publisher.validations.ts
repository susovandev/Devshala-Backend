import { z } from 'zod';

export const publisherLoginValidationSchema = z.object({
  email: z.string({ message: 'Email is required' }).email(),
  password: z.string({ message: 'Password is required' }),
});

export type TPublisherLoginRequestBody = z.infer<typeof publisherLoginValidationSchema>;

export const publisherForgotPasswordValidationSchema = z.object({
  email: z.string({ message: 'Email is required' }).email(),
});

export type TPublisherForgotPasswordRequestBody = z.infer<
  typeof publisherForgotPasswordValidationSchema
>;

export const publisherResetPasswordValidationSchema = z.object({
  token: z.string({ message: 'Token is required' }),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z
    .string({ message: 'Confirm password is required' })
    .min(8, 'Password must be at least 8 characters long'),
});

export type TPublisherResetPasswordRequestBody = z.infer<
  typeof publisherResetPasswordValidationSchema
>;

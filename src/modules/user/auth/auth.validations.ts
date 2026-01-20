import mongoose from 'mongoose';
import { z } from 'zod';

export const userRegisterValidationSchema = z.object({
  username: z
    .string({ message: 'Username is required' })
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be at most 20 characters long'),
  email: z.string({ message: 'Email is required' }).email(),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(20, 'Password must be at most 20 characters long'),
});

export type TUserRegisterDTO = z.infer<typeof userRegisterValidationSchema>;

export const userVerifyOtpValidationSchema = z.object({
  otp: z.string({ message: 'OTP is required' }).min(6, 'OTP must be at least 6 characters long'),
  userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'User id must be a valid mongoose ObjectId',
  }),
});

export type TUserVerifyOtpDTO = z.infer<typeof userVerifyOtpValidationSchema>;

export const userLoginValidationSchema = z.object({
  email: z.string({ message: 'Email is required' }).email(),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(20, 'Password must be at most 20 characters long'),
});

export type TUserLoginDTO = z.infer<typeof userLoginValidationSchema>;

export const userForgotPasswordValidationSchema = z.object({
  email: z.string({ message: 'Email is required' }).email(),
});

export type TUserForgotPasswordDTO = z.infer<typeof userForgotPasswordValidationSchema>;

export const userResetPasswordQueryValidationSchema = z.object({
  token: z.string({ message: 'Token is required' }),
});

export type TUserResetPasswordQueryDTO = z.infer<typeof userResetPasswordQueryValidationSchema>;

export const userResetPasswordValidationSchema = z.object({
  token: z.string({ message: 'Token is required' }),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(20, 'Password must be at most 20 characters long'),
  confirmPassword: z
    .string({ message: 'Confirm password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(20, 'Password must be at most 20 characters long'),
});

export type TUserResetPasswordDTO = z.infer<typeof userResetPasswordValidationSchema>;

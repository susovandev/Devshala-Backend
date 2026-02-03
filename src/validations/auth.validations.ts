import { z } from 'zod';
import { usernameSchema, emailSchema } from './user.validations.js';

const passwordSchema = z
  .string({
    message: 'Password is required',
  })
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(128, { message: 'Password must be at most 128 characters long' });

/**
 * Register validation schema
 */
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * RESET PASSWORD TOKEN SCHEMA
 */

export const resetPasswordTokenSchema = z.object({
  token: z
    .string({
      message: 'Reset token is required',
    })
    .min(20, { message: 'Invalid or expired reset token' })
    .max(1024, { message: 'Invalid or expired reset token' }),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = z.object({
  token: z
    .string({
      message: 'Reset token is required',
    })
    .min(20, { message: 'Invalid or expired reset token' })
    .max(1024, { message: 'Invalid or expired reset token' }),

  password: passwordSchema,

  confirmPassword: z.string({
    message: 'Confirm password is required',
  }),
});

/**
 * Validate otp validation schema
 */
export const otpValidationSchema = z.object({
  otp: z
    .string({
      message: 'OTP is required',
    })
    .trim()
    .regex(/^\d{6}$/, {
      message: 'OTP must be a 6-digit number',
    }),

  userId: z
    .string({
      message: 'User ID is required',
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid user ID',
    }),
});

/**
 * Validate otp validation schema
 */
export const resendOtpSchema = z.object({
  userId: z
    .string({
      message: 'User ID is required',
    })
    .regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid user ID',
    }),
});

/**
 * Change Password Schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        message: 'Current password is required',
      })
      .min(8, { message: 'Current password must be at least 8 characters long' })
      .max(128, { message: 'Current password must be at most 128 characters long' }),

    newPassword: passwordSchema,

    confirmPassword: z.string({
      message: 'Confirm password is required',
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirm password do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

import { z } from 'zod';

export const usernameSchema = z
  .string({
    message: 'Username is required',
  })
  .trim()
  .min(3, { message: 'Username must be at least 3 characters long' })
  .max(30, { message: 'Username must be at most 30 characters long' })
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  });

export const emailSchema = z
  .string({
    message: 'Email is required',
  })
  .trim()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email is too long' });

/**
 * Validate user account create schema
 */
export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
});

/**
 * Validate user account create schema
 */
export const updateUser = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Validate user Id schema
 */

export const objectIdSchema = z
  .string({ message: 'User ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid MongoDB ObjectId',
  });

export const userIdParam = z.object({
  id: objectIdSchema,
});

export const reasonSchema = z.object({
  reason: z
    .string({ message: 'Reason is required' })
    .trim()
    .min(3, { message: 'Reason must be at least 3 characters long' })
    .max(30, { message: 'Reason must be at most 30 characters long' }),
});

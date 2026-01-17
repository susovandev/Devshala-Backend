import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  username: z.string().optional(),
  bio: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
});

export type IUpdateUserProfileRequestBody = z.infer<typeof updateUserProfileSchema>;

export const updateUserPasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
});

export type IUpdateUserPasswordRequestBody = z.infer<typeof updateUserPasswordSchema>;

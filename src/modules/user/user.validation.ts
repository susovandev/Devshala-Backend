import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  username: z.string().optional(),
  bio: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
});

export type IUpdateUserProfileRequestBody = z.infer<typeof updateUserProfileSchema>;

export const updateUserPasswordSchema = z
  .object({
    oldPassword: z.string({ message: 'Old password is required' }),
    newPassword: z.string({ message: 'New password is required' }),
    confirmPassword: z.string({ message: 'Confirm password is required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
  });

export type IUpdateUserPasswordRequestBody = z.infer<typeof updateUserPasswordSchema>;

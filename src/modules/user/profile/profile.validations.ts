import { z } from 'zod';

const normalizeUrl = (val: unknown) => {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
};

export const updateUserProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must not exceed 30 characters')
      .optional(),

    bio: z.string().trim().max(300, 'Bio must not exceed 300 characters').optional(),

    socialLinks: z
      .object({
        github: z.preprocess(normalizeUrl, z.string().url('Invalid GitHub URL')).optional(),

        linkedin: z.preprocess(normalizeUrl, z.string().url('Invalid LinkedIn URL')).optional(),

        twitter: z.preprocess(normalizeUrl, z.string().url('Invalid Twitter URL')).optional(),
      })
      .optional(),
  })
  .strict();

export type TUserUpdateProfileDTO = z.infer<typeof updateUserProfileSchema>;

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

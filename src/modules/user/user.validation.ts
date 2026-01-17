import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  username: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: z
    .object({
      github: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
    })
    .optional(),
});

export type IUpdateUserProfileRequestBody = z.infer<typeof updateUserProfileSchema>;

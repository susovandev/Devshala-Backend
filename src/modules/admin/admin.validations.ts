import { z } from 'zod';

export const createPublisherValidationSchema = z.object({
  username: z.string({ message: 'Username is required' }),
  email: z.string({ message: 'Email is required' }).email(),
});

export type TCreatePublisherRequestBody = z.infer<typeof createPublisherValidationSchema>;

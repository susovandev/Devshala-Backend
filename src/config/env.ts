import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5555),
  HOST: z.string().default('127.0.0.1'),

  SERVICE_NAME: z.string(),
  API_VERSION: z.string(),

  CLIENT_DEVELOPMENT_URL: z.string().optional(),
  CLIENT_PRODUCTION_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);

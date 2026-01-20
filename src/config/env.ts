import { z } from 'zod';

const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5555),
  HOST: z.string().default('127.0.0.1'),
  BASE_URL: z.string().default('http://localhost:5555'),

  SERVICE_NAME: z.string().default('DevshalaBackend'),
  API_VERSION: z.string().default('1.0.0'),
  SUPPORT_EMAIL: z.string().default('FgM5j@example.com'),

  CLIENT_DEVELOPMENT_URL: z.string().default('http://localhost:3000'),
  CLIENT_PRODUCTION_URL: z.string().default('http://localhost:3001'),

  MAIL_SERVICE: z.string().default('gmail'),
  MAIL_HOST: z.string().default('smtp.gmail.com'),
  MAIL_PORT: z.coerce.number().default(465),
  MAIL_USER: z.string().default('FgM5j@example.com'),
  MAIL_PASSWORD: z.string().default('password'),

  ACCESS_TOKEN_SECRET_KEY: z.string().default('access-token-secret-key'),
  REFRESH_TOKEN_SECRET_KEY: z.string().default('refresh-token-secret-key'),

  FORGOT_PASSWORD_SECRET_KEY: z.string().default('forgot-password-secret-key'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  SESSION_SECRET: z.string().default('session-secret'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
});

const DatabaseEnvSchema = z.object({
  DATABASE_URI: z.string(),
  DATABASE_NAME: z.string(),
});

const EnvSchema =
  process.env.NODE_ENV === 'test' ? BaseEnvSchema : BaseEnvSchema.merge(DatabaseEnvSchema);

export const env = EnvSchema.passthrough().parse(process.env);

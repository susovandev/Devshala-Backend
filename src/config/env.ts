import { z } from 'zod';

const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5555),
  HOST: z.string().default('127.0.0.1'),

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
});

const DatabaseEnvSchema = z.object({
  DATABASE_URI: z.string(),
  DATABASE_NAME: z.string(),
});

const EnvSchema =
  process.env.NODE_ENV === 'test' ? BaseEnvSchema : BaseEnvSchema.merge(DatabaseEnvSchema);

export const env = EnvSchema.passthrough().parse(process.env);

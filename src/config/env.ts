import { z } from 'zod';

const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5555),
  HOST: z.string().default('127.0.0.1'),

  SERVICE_NAME: z.string().default('DevshalaBackend'),
  API_VERSION: z.string().default('1.0.0'),

  CLIENT_DEVELOPMENT_URL: z.string().default('http://localhost:3000'),
  CLIENT_PRODUCTION_URL: z.string().default('http://localhost:3001'),
});

const DatabaseEnvSchema = z.object({
  DATABASE_URI: z.string(),
  DATABASE_NAME: z.string(),
});

const EnvSchema =
  process.env.NODE_ENV === 'test' ? BaseEnvSchema : BaseEnvSchema.merge(DatabaseEnvSchema);

export const env = EnvSchema.passthrough().parse(process.env);

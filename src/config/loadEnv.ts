import dotenv from 'dotenv';
import fs from 'fs';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const envPath = `.env.${nodeEnv}`;

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

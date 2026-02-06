import '@config/loadEnv.js';
import { env } from '@config/env.js';
import initializeApp from 'app.js';
import Logger from '@config/logger.js';
import { connectDB } from '@config/database.js';

export default async function startServer() {
  const app = initializeApp();

  const { HOST, PORT, SERVICE_NAME, NODE_ENV } = env;

  await connectDB();
  app.listen(env.PORT, () => {
    Logger.info(`${SERVICE_NAME} is running at http://${HOST}:${PORT} in ${NODE_ENV} mode`);
  });
}

if (env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    Logger.error('Failed to start server', err);
    process.exit(1);
  });
}

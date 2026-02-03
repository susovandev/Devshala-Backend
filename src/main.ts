import '@config/loadEnv.js';

import './workers/logoutCleanup.worker.js';
import './workers/sendEmail.worker.js';
import './workers/loginTracker.worker.js';
import './workers/register.worker.js';

import { env } from '@config/env.js';
import initializeApp from 'app.js';
import Logger from '@config/logger.js';
import { connectDB } from '@config/database.js';

export default async function bootStrapApplication() {
  const app = initializeApp();

  const { HOST, PORT, SERVICE_NAME, NODE_ENV } = env;

  if (env.NODE_ENV !== 'test') {
    await connectDB();
    app.listen(env.PORT, () => {
      Logger.info(`${SERVICE_NAME} is running at http://${HOST}:${PORT} in ${NODE_ENV} mode`);
    });
  }
}

bootStrapApplication();

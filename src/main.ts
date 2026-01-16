import { env } from '@config/env.js';
import initializeApp from 'app.js';
import Logger from '@config/logger.js';

export default async function bootStrapApplication() {
  const app = initializeApp();

  const { HOST, PORT, SERVICE_NAME, NODE_ENV } = env;

  if (env.NODE_ENV !== 'test') {
    app.listen(env.PORT, () => {
      Logger.info(`${SERVICE_NAME} is running at http://${HOST}:${PORT} in ${NODE_ENV} mode`);
    });
  }
}

bootStrapApplication();

import '@config/loadEnv.js';
import Logger from '@config/logger.js';
import { connectDB } from '@config/database.js';

import './workers/logoutCleanup.worker.js';
import './workers/sendEmail.worker.js';
import './workers/loginTracker.worker.js';
import './workers/register.worker.js';

async function startWorkers() {
  await connectDB();
  Logger.info('All BullMQ workers started');
}

startWorkers();

// Graceful shutdown
process.on('SIGTERM', async () => {
  Logger.info('Worker shutting down');
  process.exit(0);
});

process.on('SIGINT', async () => {
  Logger.info('Worker interrupted');
  process.exit(0);
});

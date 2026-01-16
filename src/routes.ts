import type { Application } from 'express';

import healthCheckRoutes from '@modules/health/health.routes.js';

export default function configureRoutes(app: Application) {
  app.use('/healthcheck', healthCheckRoutes);
}

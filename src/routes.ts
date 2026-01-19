import type { Application } from 'express';
// import { env } from '@config/env.js';

import healthCheckRoutes from '@modules/health/health.routes.js';
// import authRoutes from '@modules/auth/auth.routes.js';
// import userRoutes from '@modules/user/user.routes.js';
import adminRoutes from '@modules/admin/admin.routes.js';
import publisherRoutes from '@modules/publishers/publisher.routes.js';
import frontendRoutes from '@modules/frontend/frontend.routes.js';

export default function configureRoutes(app: Application) {
  app.use('/healthcheck', healthCheckRoutes);
  // app.use(`/api/${env.API_VERSION}/auth`, authRoutes);
  // app.use(`/api/${env.API_VERSION}/users`, userRoutes);
  app.use(`/admin`, adminRoutes);
  app.use(`/publishers`, publisherRoutes);

  app.use('/', frontendRoutes);
}

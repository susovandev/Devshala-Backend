import type { Application } from 'express';

import uerRoutes from '@modules/user/user.routes.js';
import userDashboardRoutes from '@modules/user/dashboard/dashboard.routes.js';
import healthCheckRoutes from '@modules/health/health.routes.js';
import adminRoutes from '@modules/admin/admin.routes.js';
import publisherRoutes from '@modules/publishers/publisher.routes.js';
import frontendRoutes from '@modules/frontend/frontend.routes.js';

export default function configureRoutes(app: Application) {
  app.use('/healthcheck', healthCheckRoutes);
  app.use('/users', uerRoutes);
  app.use('/users/dashboard', userDashboardRoutes);
  app.use(`/admin`, adminRoutes);
  app.use(`/publishers`, publisherRoutes);

  app.use('/', frontendRoutes);
}

import express from 'express';
import type { Application } from 'express';
import configureRoutes from './routes.js';
import { REQUEST_BODY_LIMIT } from 'constants/index.js';
import { notFoundHandler } from '@middlewares/notfound.middleware.js';
import { errorHandler } from '@middlewares/error.middleware.js';

export default function initializeApp() {
  const app: Application = express();

  // Body-parser middlewares
  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));

  // Routes
  configureRoutes(app);

  // 404 Middleware
  app.use(notFoundHandler);

  // Error Middleware
  app.use(errorHandler);

  return app;
}

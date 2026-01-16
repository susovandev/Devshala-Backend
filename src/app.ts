import express from 'express';
import type { Application } from 'express';
import configureRoutes from './routes.js';

export default function initializeApp() {
  const app: Application = express();

  // Routes
  configureRoutes(app);

  return app;
}

import express from 'express';
import type { Application } from 'express';

export default function initializeApp() {
  const app: Application = express();

  return app;
}

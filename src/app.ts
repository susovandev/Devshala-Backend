import express from 'express';
import path from 'node:path';
import type { Application } from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import cookieParser from 'cookie-parser';
import configureRoutes from './routes.js';
import { REQUEST_BODY_LIMIT } from 'constants/index.js';
import { notFoundHandler } from '@middlewares/notfound.middleware.js';
import { errorHandler } from '@middlewares/error.middleware.js';
import morganMiddleware from '@config/morgan.js';
import { flashMiddleware } from '@middlewares/flash.middleware.js';

export default function initializeApp() {
  const app: Application = express();

  // Morgan middleware
  app.use(morganMiddleware);

  // Body-parser middlewares
  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));

  // Static middleware
  app.use(express.static('public'));

  // Set view engine
  app.set('view engine', 'ejs');

  // Set views directory
  app.set('views', path.join(process.cwd(), 'src', 'views'));

  // Cookie-parser middleware
  app.use(cookieParser());

  // set trust proxy
  app.set('trust proxy', true);

  app.use(
    session({
      name: 'admin_session',
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60, // 1 hour
      },
    }),
  );

  app.use(flash());

  app.use(flashMiddleware);

  // Routes
  configureRoutes(app);

  // 404 Middleware
  app.use(notFoundHandler);

  // Error Middleware
  app.use(errorHandler);

  return app;
}

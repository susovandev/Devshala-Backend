import http from 'node:http';
import express from 'express';
import path from 'node:path';
import helmet from 'helmet';
import type { Application } from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import cookieParser from 'cookie-parser';
import configureRoutes from './routes.js';
import { REQUEST_BODY_LIMIT } from 'constants/index.js';
import { notFoundHandler } from '@middlewares/notfound.middleware.js';
import { errorHandler } from '@middlewares/error.middleware.js';
import morganMiddleware from '@config/morgan.js';
import methodOverride from 'method-override';
import { env } from '@config/env.js';
import { initSocket } from 'socket/index.js';
import { aiMain } from '@config/groq.js';

export default function initializeApp() {
  // Create Express server
  const app: Application = express();

  // Create HTTP server
  const server: http.Server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'https://res.cloudinary.com', 'https://ui-avatars.com', 'data:'],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://cdnjs.cloudflare.com',
          ],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        },
      },
    }),
  );

  app.use(morganMiddleware);

  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride('_method'));

  app.use(express.static('public'));

  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'views'));

  app.use(cookieParser());

  app.set('trust proxy', true);

  app.use(
    session({
      name: 'app_session',
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60,
      },
    }),
  );

  // Flash
  app.use(flash());

  // Middleware
  app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');

    next();
  });

  // Routes
  configureRoutes(app);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return server;
}

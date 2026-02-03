import http from 'node:http';
import express from 'express';
import path from 'node:path';
import helmet from 'helmet';
import type { Application } from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import flash from 'connect-flash';
import cookieParser from 'cookie-parser';
import configureRoutes from './routes.js';
import { REQUEST_BODY_LIMIT, SESSION_MAX_AGE } from 'constants/index.js';
import { notFoundHandler } from '@middlewares/notfound.middleware.js';
import { errorHandler } from '@middlewares/error.middleware.js';
import morganMiddleware from '@config/morgan.js';
import methodOverride from 'method-override';
import { env } from '@config/env.js';
import { initSocket } from 'socket/index.js';
import { redis } from '@config/redis.js';

export default function initializeApp() {
  // Create Express server
  const app: Application = express();

  // Create HTTP server
  const server: http.Server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  // Helmet
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
            'https://cdn.jsdelivr.net', //REQUIRED for Quill CSS
          ],

          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.tailwindcss.com',
            'https://cdn.jsdelivr.net', // REQUIRED for Quill JS
          ],

          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        },
      },
    }),
  );

  // Middlewares
  app.use(morganMiddleware);

  // Body parser
  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride('_method'));

  app.use(express.static('public'));

  // View engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'views'));

  app.use(cookieParser());

  app.set('trust proxy', 1);

  const isProd = env.NODE_ENV === 'production';
  app.use(
    session({
      store: new RedisStore({ client: redis }),
      name: 'app_session',
      secret: env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: false, // ONLY if HTTPS exists
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
      },
    }),
  );

  // app_session

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
  // app.use(errorHandler);

  return server;
}

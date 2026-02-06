import http from 'node:http';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import type { Application } from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import flash from 'connect-flash';
import cookieParser from 'cookie-parser';
import configureRoutes from './routes.js';
import { REQUEST_BODY_LIMIT, SESSION_MAX_AGE } from 'constants/index.js';
import { notFoundHandler } from '@middlewares/notfound.middleware.js';
import morganMiddleware from '@config/morgan.js';
import methodOverride from 'method-override';
import { env } from '@config/env.js';
import { initSocket } from 'socket/index.js';
import { redis } from '@config/redis.js';

export default function initializeApp() {
  const app: Application = express();

  const server: http.Server = http.createServer(app);

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
            'https://cdn.jsdelivr.net',
          ],

          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.tailwindcss.com',
            'https://cdn.jsdelivr.net',
          ],

          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        },
      },
    }),
  );

  app.use(morganMiddleware);

  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride('_method'));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));
  app.use(express.static(path.join(__dirname, '../public')));

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
      rolling: false,
      cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
      },
    }),
  );

  app.use(flash());

  app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');

    next();
  });

  configureRoutes(app);

  app.use(notFoundHandler);

  return server;
}

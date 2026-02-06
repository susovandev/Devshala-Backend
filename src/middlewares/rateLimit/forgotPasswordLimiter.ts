import { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,

  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    const safeIp = ipKeyGenerator(req?.ip || 'unknown');
    return `${safeIp}:${email}`;
  },

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  }),

  handler: (req: Request, res: Response) => {
    req.flash('error', 'Too many password reset requests for this email. Please try again later.');

    res.redirect(req.originalUrl);
  },
});

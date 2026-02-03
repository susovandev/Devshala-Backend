import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,

  // Key generator for redis store based on request
  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}:${email}`;
  },

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  }),

  handler: (req: Request, res: Response) => {
    req.flash('error', 'Too many requests, please try again later');
    return res.redirect(req.originalUrl);
  },
});

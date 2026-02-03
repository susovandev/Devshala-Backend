import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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

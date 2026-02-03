import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';

export const updateProfileLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 10 minutes
  max: 10,

  keyGenerator: (req: Request) => {
    return req.user?._id.toString() || req.ip || '';
  },

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  }),

  handler: (req: Request, res: Response) => {
    req.flash('error', 'Too many profile update attempts. Please try again later.');
    return res.redirect(req.originalUrl);
  },
});

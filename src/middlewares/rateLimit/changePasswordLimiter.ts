import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';

export const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,

  keyGenerator: (req: Request) => {
    return req.user?._id.toString() || req.ip || '';
  },

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  }),

  handler: (req: Request, res: Response) => {
    req.flash('error', 'Too many password change attempts. Please try again after some time.');
    return res.redirect(req.originalUrl);
  },
});

import { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';

export const updateProfileLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 10 minutes
  max: 10,

  keyGenerator: (req: Request) => {
    if (req.user?._id) {
      return req.user._id.toString();
    }

    return ipKeyGenerator(req?.ip || 'unknown');
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

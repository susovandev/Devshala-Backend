import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';

export const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: async (
      command: string,
      ...args: Array<string | number | Buffer>
    ): Promise<any> => {
      return await redis.call(command, ...args);
    },
  }),

  handler: (req: Request, res: Response) => {
    req.flash('error', 'Too many requests, please try again later');
    return res.redirect(req.originalUrl);
  },
});

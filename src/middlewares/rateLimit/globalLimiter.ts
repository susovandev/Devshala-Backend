import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
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

  handler: (req, res) => {
    // EJS-friendly response
    res.status(429).render('errors/429', {
      message: 'Too many requests. Please slow down.',
    });
  },
});

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  }),

  handler: (req, res) => {
    res.status(429).render('errors/429', {
      message: 'Too many requests. Please slow down.',
    });
  },
});

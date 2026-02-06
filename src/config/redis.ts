import { createClient } from 'redis';

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASSWORD,
});

redis.on('connect', () => {
  console.log('Redis connected (node-redis)');
});

redis.on('error', (err) => {
  console.error('Redis error', err);
});

await redis.connect();

export { redis };

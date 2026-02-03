import { queueRedis } from '@config/queueRedis.js';
/**
 * Set data in Redis
 * @param {string} key
 * @param {any} value
 * @param {number} ttl
 */
export async function redisSet(key: string, value: any, ttl = 0) {
  try {
    const data = JSON.stringify(value);

    if (ttl) {
      await queueRedis.set(key, data, 'EX', ttl);
    } else {
      await queueRedis.set(key, data);
    }
  } catch (error) {
    console.error('Redis SET error:', error);
  }
}

/**
 * Get data from Redis
 * @param {string} key
 * @returns {any | null}
 */
export async function redisGet(key: string) {
  try {
    const data = await queueRedis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

/**
 * Delete key
 */
export async function redisDel(key: string) {
  try {
    await queueRedis.del(key);
  } catch (error) {
    console.error('Redis DEL error:', error);
  }
}

/**
 * Delete redis keys by pattern (SAFE - uses SCAN)
 * @param {string} pattern
 */
export async function redisDelByPattern(pattern: string) {
  try {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await queueRedis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);

      cursor = nextCursor;

      if (keys.length > 0) {
        await queueRedis.del(keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    console.error('Redis DEL by pattern error:', error);
  }
}

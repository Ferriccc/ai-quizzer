import { createClient, RedisClientType } from 'redis';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
    });

    await redisClient.connect();
    logger.info('Redis connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

// Redis utility functions
export const redisUtils = {
  // Set key with expiration
  setex: async (key: string, seconds: number, value: string): Promise<void> => {
    await redisClient.setEx(key, seconds, value);
  },

  // Get key
  get: async (key: string): Promise<string | null> => {
    return await redisClient.get(key);
  },

  // Delete key
  del: async (key: string): Promise<number> => {
    return await redisClient.del(key);
  },

  // Check if key exists
  exists: async (key: string): Promise<number> => {
    return await redisClient.exists(key);
  },

  // Set hash
  hset: async (key: string, field: string, value: string): Promise<number> => {
    return await redisClient.hSet(key, field, value);
  },

  // Get hash
  hget: async (key: string, field: string): Promise<string | undefined> => {
    return await redisClient.hGet(key, field);
  },

  // Get all hash fields
  hgetall: async (key: string): Promise<Record<string, string>> => {
    return await redisClient.hGetAll(key);
  },

  // Set with JSON
  setJSON: async (key: string, value: any, seconds?: number): Promise<void> => {
    const jsonValue = JSON.stringify(value);
    if (seconds) {
      await redisClient.setEx(key, seconds, jsonValue);
    } else {
      await redisClient.set(key, jsonValue);
    }
  },

  // Get with JSON
  getJSON: async <T>(key: string): Promise<T | null> => {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  },

  // Increment counter
  incr: async (key: string): Promise<number> => {
    return await redisClient.incr(key);
  },

  // Set expiry
  expire: async (key: string, seconds: number): Promise<boolean> => {
    return await redisClient.expire(key, seconds);
  },

  // Get TTL
  ttl: async (key: string): Promise<number> => {
    return await redisClient.ttl(key);
  }
};

// Redis health check
export const redisHealthCheck = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};

export default {
  connectRedis,
  getRedisClient,
  closeRedis,
  redisUtils,
  redisHealthCheck
};

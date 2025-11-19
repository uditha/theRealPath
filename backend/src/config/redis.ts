import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;
let isConnecting = false;
let connectionFailed = false;

/**
 * Get Redis client - lazy initialization
 * Only connects if REDIS_URL is set and connection hasn't failed
 */
export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (connectionFailed) {
    return null;
  }

  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (isConnecting) {
    return null;
  }

  try {
    isConnecting = true;
    
    if (!redisClient) {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.warn('Redis connection failed after multiple retries, disabling Redis');
              connectionFailed = true;
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
          connectTimeout: 5000,
        },
      });

      redisClient.on('error', (err: Error) => {
        logger.warn('Redis Client Error (non-fatal)', { error: err.message });
      });

      redisClient.on('connect', () => {
        logger.info('Redis Client Connected');
        connectionFailed = false;
      });

      redisClient.on('reconnecting', () => {
        logger.info('Redis Client Reconnecting...');
      });
    }

    if (!redisClient.isOpen) {
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        ),
      ]);
    }

    isConnecting = false;
    return redisClient;
  } catch (error: any) {
    isConnecting = false;
    logger.warn('Redis connection failed, continuing without Redis', {
      error: error.message,
    });
    connectionFailed = true;
    redisClient = null;
    return null;
  }
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = async (): Promise<boolean> => {
  const client = await getRedisClient();
  return client !== null && client.isOpen;
};

// Default export for backward compatibility
const defaultExport = {
  get isOpen() {
    return redisClient?.isOpen || false;
  },
  get: async (key: string) => {
    const client = await getRedisClient();
    if (!client) return null;
    try {
      return await client.get(key);
    } catch (error) {
      logger.warn('Redis get error', { error });
      return null;
    }
  },
  set: async (key: string, value: string, options?: { EX?: number }) => {
    const client = await getRedisClient();
    if (!client) return;
    try {
      await client.set(key, value, options);
    } catch (error) {
      logger.warn('Redis set error', { error });
    }
  },
  setEx: async (key: string, seconds: number, value: string) => {
    const client = await getRedisClient();
    if (!client) return;
    try {
      await client.setEx(key, seconds, value);
    } catch (error) {
      logger.warn('Redis setEx error', { error });
    }
  },
  del: async (key: string | string[]) => {
    const client = await getRedisClient();
    if (!client) return 0;
    try {
      if (Array.isArray(key)) {
        if (key.length === 0) return 0;
        return await client.del(key);
      }
      return await client.del(key);
    } catch (error) {
      logger.warn('Redis del error', { error });
      return 0;
    }
  },
};

export default defaultExport;


import Redis from 'ioredis';
import { Config } from './index.js';
import logger from './logger.js';

let redisClient;

try {
  redisClient = new Redis({
    host: Config.REDIS_HOST,
    port: Config.REDIS_PORT || 16942,
    password: Config.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    logger.info(`Redis connected successfully to ${Config.REDIS_HOST || 'cloud-instance'}`);
  });

  redisClient.on('ready', () => {
    logger.info('Redis client is ready to accept commands');
  });

  redisClient.on('reconnecting', () => {
    logger.warn('Redis client is reconnecting...');
  });

  redisClient.on('error', err => {
    logger.error('Redis connection error:', err);
  });
} catch (error) {
  logger.error('Failed to initialize Redis client:', error);
}

export default redisClient;

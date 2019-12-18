import request from 'request-promise';
import redis from 'redis';
import config from 'config';
import logger from '../../logger';

export interface SetCacheOptions {
  mode: string;
  duration: number;
  flag: string;
}

const opts = {
  host: config.get('redis.host'),
  port: config.get('redis.port'),
  db: 1
} as redis.ClientOpts;

const client = redis.createClient(opts);

/**
 * ! Manual Promise rather than Bluebird or utils.promisify, both failed to do the right thing with
 * ! typescript..sadly. Old school Promise comes through as the winner.
 */
export const flushDbAsync = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    client.flushdb((err, reply) => {
      if (err) reject(err);
      resolve(reply);
    });
  });
};
/**
 * ! Manual Promise rather than Bluebird or utils.promisify, both failed to do the right thing with
 * ! typescript..sadly. Old school Promise comes through as the winner.
 * @param key the cache key name
 */
export const getAsync = async (key: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, reply) => {
      if (err) reject(err);
      resolve(reply);
    });
  });
};
/**
 * ! Manual Promise rather than Bluebird or utils.promisify, both failed to do the right thing with
 * ! typescript..sadly. Old school Promise comes through as the winner.
 * @param key the cache key to fetch
 * @param data the data to cache
 * @param options the options to set the cache TTL
 */
export const setAsync = async (
  key: string,
  data: string,
  options: SetCacheOptions
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    client.set(key, data, options.mode, options.duration, options.flag, (err, reply) => {
      if (err) reject(err);
      resolve(reply === 'OK');
    });
  });
};

client.on('error', err => logger().error(`cache: redisClient.on('error'): ${err}`));

export const getCache = async (key: string): Promise<string | null> => {
  const reply = await getAsync(key);
  if (!reply) logger().debug(`getCache(${key}) failed to find data.`);
  return reply;
};

export const setCache = async (
  key: string,
  data: string,
  options: SetCacheOptions
): Promise<boolean> => {
  const reply = await setAsync(key, data, options);
  if (!reply) logger().debug(`setCache(${key}, ${data}) failed to set cache.`);
  return reply;
};

export interface CacheOptions {
  key: string;
  ttlSeconds: number;
}

/**
 * Optionally perform caching of the API data, defaulting to no cache.
 * @param url the API url to fetch
 * @param requestOptions the options to pass to the request
 * @param performCache optionally perform a cache of the API data fetched
 * @param cacheOptions the cache options for a specific key and/or TTL for the data
 */
export const get = async (
  url: string,
  requestOptions: request.RequestPromiseOptions,
  performCache?: boolean,
  cacheOptions?: CacheOptions
) => {
  const willCache = performCache || false;
  const { key, ttlSeconds } = cacheOptions || { key: url, ttlSeconds: 60 };
  if (willCache) {
    const cached = await getCache(key);
    if (cached && requestOptions.json) return Promise.resolve(JSON.parse(cached));
    if (cached) return Promise.resolve(cached);
  }

  const response = await request.get(url, requestOptions);

  if (willCache) {
    let cacheString = response;
    if (requestOptions.json) {
      cacheString = JSON.stringify(response);
    }
    await setCache(key, cacheString, { mode: 'EX', duration: ttlSeconds, flag: 'NX' });
  }

  return response;
};

/**
 * Flushes the cache database
 */
export const flushDb = async (): Promise<boolean> => {
  const reply = await flushDbAsync();
  return reply.toLowerCase() === 'ok';
};

export default { get, flushDb, getAsync, setAsync, flushDbAsync };

import request from 'node-fetch';
import redis from 'redis';
import config from 'config';
import logger from '../../logger';

const DEFAULT_DB: number = 1;
export const AUTH_DB: number = 2;

export interface SetCacheOptions {
  mode: string;
  duration: number;
  flag: string;
}

const opts = {
  host: config.get('redis.host'),
  port: config.get('redis.port'),
  db: DEFAULT_DB,
} as redis.ClientOpts;

const client = redis.createClient(opts);

/**
 * ! Manual Promise rather than Bluebird or utils.promisify, both failed to do the right thing with
 * ! typescript..sadly. Old school Promise comes through as the winner.
 */
export const selectDbAsync = async (db: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    client.select(db, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

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
  options?: SetCacheOptions,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (options) {
      client.set(key, data, options.mode, options.duration, options.flag, (err, reply) => {
        if (err) reject(err);
        resolve(reply === 'OK');
      });
    } else {
      client.set(key, data, (err, reply) => {
        if (err) reject(err);
        resolve(reply === 'OK');
      });
    }
  });
};

client.on('error', (err) => logger().error(`cache: redisClient.on('error'): ${err}`));

export const getCache = async (key: string, db: number = DEFAULT_DB): Promise<string | null> => {
  await selectDbAsync(db);
  const reply = await getAsync(key);
  if (!reply) logger().debug(`getCache(${key}) failed to find data.`);
  return reply;
};

export const setCache = async (
  key: string,
  data: string,
  options?: SetCacheOptions,
  db?: number,
): Promise<boolean> => {
  await selectDbAsync(db || DEFAULT_DB);
  const reply = await setAsync(key, data, options);
  if (!reply) logger().debug(`setCache(${key}, ${data}) failed to set cache.`);
  return reply;
};

export interface CacheOptions {
  key: string;
  ttlSeconds: number;
}

const requestRetry = async (
  url: string,
  options: any,
  conditions: { codes: number[]; times: number },
) => {
  try {
    const response = await request(url, options);
    if (response.ok) return response;
    throw Object({
      response: {
        status: response.status,
        statusCode: response.status,
        statusText: response.statusText,
      },
    });
  } catch (err) {
    if (!conditions.codes.includes(err.response.status)) throw err;
    if (conditions.times < 1) throw err;
    logger().debug(
      `cache.requestRetry retrying times:${conditions.times}, status:${err.response.status}, url:${url}, options:${options}`,
    );
    return requestRetry(url, options, { codes: conditions.codes, times: conditions.times - 1 });
  }
};

/**
 * Optionally perform caching of the API data, defaulting to no cache.
 * @param url the API url to fetch
 * @param requestOptions the options to pass to the request
 * @param performCache optionally perform a cache of the API data fetched
 * @param cacheOptions the cache options for a specific key and/or TTL for the data
 */
/* eslint-disable consistent-return */
export const get = async (
  url: string,
  requestOptions: { json?: boolean; headers?: any },
  performCache?: boolean,
  cacheOptions?: CacheOptions,
  retryStatusCodes?: number[],
) => {
  const willCache = performCache || false;
  const { key, ttlSeconds } = cacheOptions || { key: url, ttlSeconds: 60 };
  if (willCache) {
    const cached = await getCache(key);
    if (cached && requestOptions.json) return Promise.resolve(JSON.parse(cached));
    if (cached) return Promise.resolve(cached);
  }

  try {
    logger().debug(`cache.get requesting url:${url}`);
    const response = await requestRetry(
      url,
      {
        method: 'GET',
        headers: { ...requestOptions.headers },
      },
      { codes: retryStatusCodes ?? [], times: 1 },
    );
    if (response.ok) {
      const responseText = await response.text();
      if (willCache) {
        await setCache(key, responseText, { mode: 'EX', duration: ttlSeconds, flag: 'NX' });
      }

      if (requestOptions.json) return JSON.parse(responseText);
      return responseText;
    }
  } catch (err) {
    throw err;
  }
};
/* eslint-enable consistent-return */

/**
 * Flushes the cache database
 */
export const flushDb = async (db: number = DEFAULT_DB): Promise<boolean> => {
  await selectDbAsync(db);
  const reply = await flushDbAsync();
  return reply.toLowerCase() === 'ok';
};

export default {
  get,
  flushDb,
  getAsync,
  setAsync,
  flushDbAsync,
  selectDbAsync,
};

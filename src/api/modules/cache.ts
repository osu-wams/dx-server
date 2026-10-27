import { createClient } from 'redis';
import { REDIS_HOST, REDIS_PORT } from '../../constants';
import logger from '../../logger';

const DEFAULT_DB: number = 1;
export const AUTH_DB: number = 2;

export interface SetCacheOptions {
  mode: string;
  duration: number;
  flag: string;
}

const client = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
  database: DEFAULT_DB,
});

client.on('error', (err) => logger().error(`cache: redisClient.on('error'): ${err}`));

/**
 * node-redis v4+ requires an explicit connection, commands issued before the connection
 * is established are queued and flushed once the client is ready.
 */
export const connect = async (): Promise<void> => {
  if (!client.isOpen) {
    await client.connect();
  }
};

connect().catch((err) => logger().error(`cache: redisClient.connect() failed: ${err}`));

/**
 * Translate the legacy (redis v3 style) set arguments into node-redis v4+ set options.
 * ie. `{ mode: 'EX', duration: 60, flag: 'NX' }` becomes `{ expiration: { type: 'EX', value: 60 }, condition: 'NX' }`
 */
const toSetOptions = (options?: SetCacheOptions): Record<string, unknown> | undefined => {
  if (!options) return undefined;
  const setOptions: Record<string, unknown> = {};
  if (options.mode) setOptions.expiration = { type: options.mode, value: options.duration };
  if (options.flag) setOptions.condition = options.flag;
  return setOptions;
};

export const selectDbAsync = async (db: number) => client.select(db);
export const flushDbAsync = async () => client.flushDb();
export const getAsync = async (key: string): Promise<string | null> =>
  (await client.get(key)) as string | null;
export const setAsync = async (
  key: string,
  value: string,
  options?: SetCacheOptions,
): Promise<string | null> => (await client.set(key, value, toSetOptions(options) as any)) as string | null;
export const delAsync = async (key: string) => client.del(key);

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
  return !!reply;
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
    const response = await fetch(url, options);
    if (response.ok) return response;
    throw Object({
      response: {
        status: response.status,
        statusCode: response.status,
        statusText: response.statusText,
        body: await response.text(),
      },
    });
  } catch (err) {
    const expiredCert = (err.code ?? err.cause?.code) === 'CERT_HAS_EXPIRED';
    if (expiredCert) {
      logger().error(
        `cache.request url:${url}, failed because its SSL certificate has expired, escalate to proper system admin for repair.`,
      );
    }
    if (
      (conditions.codes.length && !conditions.codes.includes(err.response?.status)) ||
      conditions.times < 1 ||
      expiredCert
    ) {
      throw err;
    }
    logger().debug(
      `cache.requestRetry retrying times:${conditions.times}, status:${err.response?.status}, url:${url}, options:${options}`,
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
};

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
  delAsync,
};

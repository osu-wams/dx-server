/**
 * A minimal in-memory stand-in for the node-redis (v4+) client API used by this application,
 * replacing the unmaintained `redis-mock` package which only supported the redis v3 callback API.
 *
 * The in-memory stores are shared across every client instance (just like a real redis server)
 * so that clients created in different modules observe the same data.
 */
interface Entry {
  value: string;
  expiresAt?: number;
}

interface SetOptions {
  EX?: number;
  PX?: number;
  NX?: boolean;
  XX?: boolean;
  expiration?: { type: 'EX' | 'PX' | 'EXAT' | 'PXAT'; value: number } | 'KEEPTTL';
  condition?: 'NX' | 'XX';
}

const stores = new Map<number, Map<string, Entry>>();

const storeFor = (db: number): Map<string, Entry> => {
  if (!stores.has(db)) stores.set(db, new Map());
  return stores.get(db);
};

class MockRedisClient {
  private db: number;

  public isOpen = false;

  public isReady = false;

  constructor(options?: { database?: number }) {
    this.db = options?.database ?? 0;
  }

  on() {
    return this;
  }

  async connect() {
    this.isOpen = true;
    this.isReady = true;
    return this;
  }

  async disconnect() {
    this.isOpen = false;
    this.isReady = false;
  }

  async quit() {
    await this.disconnect();
    return 'OK';
  }

  async select(db: number) {
    this.db = db;
    return 'OK';
  }

  private entry(key: string): Entry | undefined {
    const store = storeFor(this.db);
    const found = store.get(key);
    if (found?.expiresAt && found.expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }
    return found;
  }

  async get(key: string): Promise<string | null> {
    return this.entry(key)?.value ?? null;
  }

  async set(key: string, value: string | number, options?: SetOptions): Promise<string | null> {
    const exists = this.entry(key) !== undefined;
    const condition = options?.condition ?? (options?.NX ? 'NX' : options?.XX ? 'XX' : undefined);
    if (condition === 'NX' && exists) return null;
    if (condition === 'XX' && !exists) return null;
    const entry: Entry = { value: `${value}` };
    const expiration =
      typeof options?.expiration === 'object'
        ? options.expiration
        : options?.EX
          ? { type: 'EX', value: options.EX }
          : options?.PX
            ? { type: 'PX', value: options.PX }
            : undefined;
    if (expiration?.type === 'EX') entry.expiresAt = Date.now() + expiration.value * 1000;
    if (expiration?.type === 'PX') entry.expiresAt = Date.now() + expiration.value;
    if (expiration?.type === 'EXAT') entry.expiresAt = expiration.value * 1000;
    if (expiration?.type === 'PXAT') entry.expiresAt = expiration.value;
    storeFor(this.db).set(key, entry);
    return 'OK';
  }

  async del(keys: string | string[]): Promise<number> {
    const store = storeFor(this.db);
    return (Array.isArray(keys) ? keys : [keys]).reduce(
      (count, key) => count + (store.delete(key) ? 1 : 0),
      0,
    );
  }

  async flushDb(): Promise<string> {
    storeFor(this.db).clear();
    return 'OK';
  }

  async flushAll(): Promise<string> {
    stores.clear();
    return 'OK';
  }
}

export const createClient = (options?: { database?: number }) => new MockRedisClient(options);

export default { createClient };

/**
 * A small nock-compatible adapter implemented on top of msw.
 *
 * nock (v14+) and msw both patch Node's HTTP client and global fetch through the same
 * interceptor library and refuse to coexist in the same process, so the test suite uses this
 * adapter to keep its existing `nock(base).get(path).query(true).reply(status, body)` style
 * while all request mocking is served by the single msw server (see `./server`).
 *
 * Supported surface: `get|post|put|patch|delete|head(path)`, `.query(true | object)`,
 * `.reply(status, body?, headers?)`, `.replyWithError(error)`, `.once()`, `.persist()` and
 * `.times(n)`. Interceptors are one-shot by default, just like nock.
 */
import { http, HttpResponse } from 'msw';
import { server } from './server';

type PathMatcher = string | RegExp | ((uri: string) => boolean);
type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';
type QueryValue = string | number | boolean;
type Query = true | Record<string, QueryValue>;
type Headers = Record<string, string>;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toResponse = (status: number, body?: unknown, headers?: Headers): Response => {
  if (body === undefined || body === null) {
    return new HttpResponse(null, { status, headers });
  }
  if (typeof body === 'string' || body instanceof Uint8Array) {
    return new HttpResponse(body, { status, headers });
  }
  return HttpResponse.json(body, { status, headers });
};

class Interceptor {
  private expectedQuery?: Query;

  private remaining = 1;

  private persistent = false;

  private readonly path: PathMatcher;

  constructor(
    private readonly scope: Scope,
    private readonly method: Method,
    path: PathMatcher,
  ) {
    // A query string embedded in the path (ie. '/user/?token=abc') acts as a query matcher
    if (typeof path === 'string' && path.includes('?')) {
      const [pathname, search] = path.split('?');
      this.path = pathname;
      this.expectedQuery = Object.fromEntries(new URLSearchParams(search).entries());
    } else {
      this.path = path;
    }
  }

  query(query: Query) {
    this.expectedQuery = query === true ? true : { ...(this.expectedQuery as object), ...query };
    return this;
  }

  once() {
    this.remaining = 1;
    return this;
  }

  twice() {
    this.remaining = 2;
    return this;
  }

  times(count: number) {
    this.remaining = count;
    return this;
  }

  persist() {
    this.persistent = true;
    return this;
  }

  reply(status: number = 200, body?: unknown, headers?: Headers) {
    this.register(() => toResponse(status, body, headers));
    return this.scope;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  replyWithError(_error: string | Error | object) {
    this.register(() => HttpResponse.error());
    return this.scope;
  }

  /**
   * Build the msw url predicate, a RegExp against the absolute request URL (msw strips the
   * query string before testing it). String paths must match exactly, RegExp paths follow
   * nock's semantics of testing the regular expression against the request path.
   */
  private predicate(): RegExp {
    const base = escapeRegExp(this.scope.baseUrl.replace(/\/$/, ''));
    if (typeof this.path === 'function') {
      // The function is evaluated against the request path in `matches`
      return new RegExp(`^${base}`);
    }
    if (this.path instanceof RegExp) {
      return new RegExp(`^${base}.*?(?:${this.path.source})`, this.path.flags.replace('g', ''));
    }
    const path = this.path === '' || this.path === '/' ? '/?' : escapeRegExp(this.path);
    return new RegExp(`^${base}${path}$`);
  }

  private matches(request: Request): boolean {
    const { pathname, search, searchParams } = new URL(request.url);
    if (typeof this.path === 'function' && !this.path(`${pathname}${search}`)) return false;
    if (!this.expectedQuery || this.expectedQuery === true) return true;
    return Object.entries(this.expectedQuery).every(
      ([key, value]) => searchParams.get(key) === String(value),
    );
  }

  private register(respond: () => Response) {
    server.use(
      http[this.method](
        this.predicate(),
        ({ request }) => {
          // Returning nothing lets msw fall through to the next matching handler
          if (!this.matches(request)) return undefined;
          if (!this.persistent) {
            if (this.remaining < 1) return undefined;
            this.remaining -= 1;
          }
          return respond();
        },
        { once: !this.persistent && this.remaining === 1 },
      ),
    );
  }
}

class Scope {
  public persistent = false;

  constructor(public readonly baseUrl: string) {}

  private intercept(method: Method, path: PathMatcher) {
    const interceptor = new Interceptor(this, method, path);
    return this.persistent ? interceptor.persist() : interceptor;
  }

  get(path: PathMatcher) {
    return this.intercept('get', path);
  }

  post(path: PathMatcher) {
    return this.intercept('post', path);
  }

  put(path: PathMatcher) {
    return this.intercept('put', path);
  }

  patch(path: PathMatcher) {
    return this.intercept('patch', path);
  }

  delete(path: PathMatcher) {
    return this.intercept('delete', path);
  }

  head(path: PathMatcher) {
    return this.intercept('head', path);
  }

  persist() {
    this.persistent = true;
    return this;
  }
}

// Options (ie. `{ encodedQueryParams: true }`) are accepted for compatibility and ignored
const nock = (baseUrl: string, _options?: Record<string, unknown>) => new Scope(baseUrl);

nock.cleanAll = () => server.resetHandlers();

export default nock;

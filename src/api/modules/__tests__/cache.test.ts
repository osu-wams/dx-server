import { rest } from 'msw';
import redis from 'redis'; // eslint-disable-line no-unused-vars
import { server } from '@src/mocks/server';
import cache from '../cache'; // eslint-disable-line no-unused-vars
import { mockCacheUrl, mockedGet, mockedGetResponse } from '../__mocks__/cache';

const mockUrlResponse = { bob: 'ross' };

describe('Cache module', () => {
  describe('get', () => {
    it('gets a string value but not from cache', async () => {
      const result = await cache.get(mockCacheUrl, {});
      expect(result).toBe(JSON.stringify(mockUrlResponse));
    });
    it('gets a string value while performing cache', async () => {
      const result = await cache.get(mockCacheUrl, {}, true);
      expect(result).toBe(JSON.stringify(mockUrlResponse));
    });
    it('gets a json object while performing cache', async () => {
      const result = await cache.get(mockCacheUrl, { json: true }, true);
      expect(result).toStrictEqual(mockUrlResponse);
    });
    it('gets a json object and caches it from a funky endpoint', async () => {
      server.use(
        rest.get('http://funky-endpoint', async (req, res, ctx) => {
          return res(ctx.status(200), ctx.body('test'));
        }),
      );
      const result = await cache.get('http://funky-endpoint', {}, true);
      expect(result).toStrictEqual('test');
    });
    it('gets a string value from cache', async () => {
      mockedGetResponse.mockReturnValue(JSON.stringify(mockUrlResponse));
      cache.get = mockedGet;
      const result = await cache.get(mockCacheUrl, {}, true);
      expect(result).toBe(JSON.stringify(mockUrlResponse));
    });
    it('gets a json object from cache', async () => {
      mockedGetResponse.mockReturnValue(mockUrlResponse);
      cache.get = mockedGet;
      const result = await cache.get(mockCacheUrl, { json: true }, true);
      expect(result).toStrictEqual(mockUrlResponse);
    });
  });
});

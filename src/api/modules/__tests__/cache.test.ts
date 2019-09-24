import nock from 'nock';
import redis from 'redis'; // eslint-disable-line no-unused-vars
import cache from '../cache'; // eslint-disable-line no-unused-vars
import { mockCacheUrl, mockedGet, mockedGetResponse } from '../__mocks__/cache';

const mockUrlResponse = { bob: 'ross' };

describe('Cache module', () => {
  describe('get', () => {
    it('gets a string value but not from cache', async () => {
      nock(mockCacheUrl)
        .get(/.*/)
        .reply(200, mockUrlResponse);
      const result = await cache.get(mockCacheUrl, {});
      expect(result).toBe(JSON.stringify(mockUrlResponse));
    });
    it('gets a string value while performing cache', async () => {
      nock(mockCacheUrl)
        .get(/.*/)
        .reply(200, mockUrlResponse);
      const result = await cache.get(mockCacheUrl, {}, true);
      expect(result).toBe(JSON.stringify(mockUrlResponse));
    });
    it('gets a json object while performing cache', async () => {
      nock(mockCacheUrl)
        .get(/.*/)
        .reply(200, mockUrlResponse);
      const result = await cache.get(mockCacheUrl, { json: true }, true);
      expect(result).toStrictEqual(mockUrlResponse);
    });
    it('gets a json object and caches it from a funky endpoint', async () => {
      nock('http://funky-endpoint')
        .get(/.*/)
        .reply(200, 'test');
      const result = await cache.get('http://funky-endpoint', { json: true }, true);
      expect(result).toStrictEqual('test');
    });
    it('gets a string value from cache', async () => {
      mockedGetResponse.mockReturnValue(JSON.stringify(mockUrlResponse));
      cache.get = mockedGet;
      nock(mockCacheUrl)
        .get(/.*/)
        .reply(200, mockUrlResponse);
      const result = await cache.get(mockCacheUrl, {}, true);
      expect(result).toBe(JSON.stringify(mockUrlResponse));
    });
    it('gets a json object from cache', async () => {
      mockedGetResponse.mockReturnValue(mockUrlResponse);
      cache.get = mockedGet;
      nock(mockCacheUrl)
        .get(/.*/)
        .reply(200, mockUrlResponse);
      const result = await cache.get(mockCacheUrl, { json: true }, true);
      expect(result).toStrictEqual(mockUrlResponse);
    });
  });
});

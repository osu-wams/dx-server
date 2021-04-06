import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { setAsync, getAsync, mockCachedData } from '../modules/__mocks__/cache';
import { mockedPageSearchIndex, mockedPageSearchIndexExpected } from '../../mocks/dx';
import { BASE_URL } from '../modules/dx';

const mockedSetCache = jest.fn();
const mockedGetCache = jest.fn();
jest.mock('../modules/cache.ts', () => ({
  ...jest.requireActual('../modules/cache.ts'),
  setCache: () => mockedSetCache(),
  selectDbAsync: () => jest.fn(),
  getCache: () => mockedGetCache(),
}));

const request = supertest.agent(app);

describe('/api/searchIndex/pages', () => {
  it('returns the indexed pages for the search feature', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    cache.setAsync = setAsync;
    nock(BASE_URL).get(/.*/).reply(200, { data: mockedPageSearchIndex });
    const result = await request.get('/api/searchIndex/pages');
    expect(result.ok).toBeTruthy();
    expect(result.body).toStrictEqual(mockedPageSearchIndexExpected);
  });

  it('should return error message there is a 500 error', async () => {
    nock(BASE_URL).get(/.*/).reply(500);
    await request
      .get('/api/searchIndex/pages')
      .expect(500, { message: 'Search Index Pages API failed.' });
  });
});

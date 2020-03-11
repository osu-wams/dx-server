import nock from 'nock';
import { getTrendingResources, mappedTrendingResources } from '../google';
import {
  trendingResourcesResponse,
  mockedTrendingResources,
} from '../../../mocks/google/trendingResources';

const mockedGetCache = jest.fn();
jest.mock('../cache', () => ({
  ...jest.requireActual('../cache'),
  getCache: () => mockedGetCache(),
  setCache: jest.fn(),
}));

describe('Google api module', () => {
  beforeEach(() => {
    nock('https://www.googleapis.com').removeAllListeners();
    nock('https://www.googleapis.com')
      .persist()
      .post('/oauth2/v4/token')
      .reply(200, {});
    mockedGetCache.mockReturnValue(null);
  });
  it('fetches trending resources', async () => {
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .reply(200, trendingResourcesResponse.data);
    const result = await getTrendingResources(new Date());
    expect(result).toMatchObject(
      mappedTrendingResources(mockedTrendingResources, new Date().toISOString().slice(0, 10)),
    );
  });
  it('fetches trending resources from cache', async () => {
    mockedGetCache.mockReturnValue(JSON.stringify(mockedTrendingResources));
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .replyWithError('boom');
    const result = await getTrendingResources(new Date());
    expect(result).toMatchObject(
      mappedTrendingResources(mockedTrendingResources, new Date().toISOString().slice(0, 10)),
    );
  });
  it('returns an empty array when there are no trending resources to return', async () => {
    const emptyRows = {
      ...trendingResourcesResponse.data,
      rows: [],
    };
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .reply(200, emptyRows);
    expect(await getTrendingResources(new Date())).toMatchObject([]);
  });
  it('handles an error response from google', async () => {
    nock('https://www.googleapis.com')
      .persist()
      .get('/analytics/v3/data/ga')
      .query(true)
      .replyWithError('boom');
    const result = await getTrendingResources(new Date());
    expect(result).toBeUndefined();
  });
});

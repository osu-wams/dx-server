import nock from 'nock';
import { getTrendingResources, mappedTrendingResources } from '@src/api/modules/google';
import {
  trendingResourcesResponse,
  mockedTrendingResources,
} from '@src/mocks/google/trendingResources';
import TrendingResource from '@src/api/models/trendingResource';
import { server } from '@src/mocks/server';
import { dynamoDbHandler } from '@src/mocks/handlers';

const mockedGetCache = jest.fn();
jest.mock('../cache', () => ({
  ...jest.requireActual('../cache'),
  getCache: () => mockedGetCache(),
  setCache: jest.fn(),
}));

const dateKey = new Date().toISOString().slice(0, 10);
const date = new Date();
const trendingResource = {
  affiliation: 'Student',
  campus: 'Corvallis',
  date: '2020-01-01',
  resourceId: '03794c38-D4cb-422f-96e4-6fce8bf4850b',
  title: 'MyDegrees',
  totalEvents: 1,
  uniqueEvents: 1,
};

describe('Google api module', () => {
  afterEach(() => nock.cleanAll());
  beforeEach(() => {
    nock('https://www.googleapis.com').persist().post('/oauth2/v4/token').reply(200, {});
    mockedGetCache.mockReturnValue(null);
  });
  it('fetches trending resources from Google', async () => {
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .reply(200, trendingResourcesResponse.data);
    const result = await getTrendingResources(1, date);
    expect(result).toMatchObject([trendingResource]);
  });
  it('fetches trending resources from cache', async () => {
    mockedGetCache.mockReturnValue(
      JSON.stringify(mappedTrendingResources(mockedTrendingResources, dateKey)),
    );
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .replyWithError('boom');
    const result = await getTrendingResources(1, date);
    expect(result).toMatchObject(mappedTrendingResources(mockedTrendingResources, dateKey));
  });
  it('fetches trending resources from Dynamodb', async () => {
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .replyWithError('boom');
    const result = await getTrendingResources(1, date);
    expect(result).toMatchObject([trendingResource]);
  });
  it('returns an empty array when there are no trending resources to return', async () => {
    const itemMap = {};
    itemMap[TrendingResource.TABLE_NAME] = {
      Query: {
        Count: 0,
        ScannedCount: 0,
        Items: [],
      },
    };
    dynamoDbHandler(server, itemMap);
    const emptyRows = {
      ...trendingResourcesResponse.data,
      rows: [],
    };
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .reply(200, emptyRows);
    const result = await getTrendingResources(1, date);
    expect(result).toMatchObject([]);
  });
  it('handles an error response from google', async () => {
    const itemMap = {};
    itemMap[TrendingResource.TABLE_NAME] = {
      Query: {
        Count: 0,
        ScannedCount: 0,
        Items: [],
      },
    };
    dynamoDbHandler(server, itemMap);
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .replyWithError('boom');
    const result = await getTrendingResources(1, date);
    expect(result).toStrictEqual([]);
  });
});

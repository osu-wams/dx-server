import { http, HttpResponse } from 'msw';
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
  ...jest.requireActual('../cache') as {},
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

const GA_ENDPOINT = 'https://www.googleapis.com/analytics/v3/data/ga';

describe('Google api module', () => {
  beforeEach(() => {
    server.use(
      http.post('https://www.googleapis.com/oauth2/v4/token', async () => {
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    mockedGetCache.mockReturnValue(null);
  });
  it('fetches trending resources from Google', async () => {
    server.use(
      http.get(GA_ENDPOINT, async () => {
        return HttpResponse.json(trendingResourcesResponse.data, { status: 200 });
      }),
    );
    const result = await getTrendingResources(1, date);
    expect(result).toMatchObject([trendingResource]);
  });
  it('fetches trending resources from cache', async () => {
    mockedGetCache.mockReturnValue(
      JSON.stringify(mappedTrendingResources(mockedTrendingResources, dateKey)),
    );
    server.use(
      http.get(GA_ENDPOINT, async () => {
        return HttpResponse.json({ errorMessage: 'boom' }, { status: 403 });
      }),
    );
    const result = await getTrendingResources(1, date);
    expect(result).toMatchObject(mappedTrendingResources(mockedTrendingResources, dateKey));
  });
  it('fetches trending resources from Dynamodb', async () => {
    server.use(
      http.get(GA_ENDPOINT, async () => {
        return HttpResponse.json({ errorMessage: 'boom' }, { status: 403 });
      }),
    );
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
    server.use(
      http.get(GA_ENDPOINT, async () => {
        return HttpResponse.json(emptyRows, { status: 200 });
      }),
    );
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
    server.use(
      http.get(GA_ENDPOINT, async () => {
        return HttpResponse.json({ errorMessage: 'boom' }, { status: 403 });
      }),
    );
    const result = await getTrendingResources(1, date);
    expect(result).toStrictEqual([]);
  });
});

import { rest } from 'msw';
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

const GA_ENDPOINT = 'https://www.googleapis.com/analytics/v3/data/ga';

describe('Google api module', () => {
  beforeEach(() => {
    server.use(
      rest.post('https://www.googleapis.com/oauth2/v4/token', async (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({}));
      }),
    );
    mockedGetCache.mockReturnValue(null);
  });
  it('fetches trending resources from Google', async () => {
    server.use(
      rest.get(GA_ENDPOINT, async (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(trendingResourcesResponse.data));
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
      rest.get(GA_ENDPOINT, async (req, res, ctx) => {
        return res(ctx.status(403), ctx.json({ errorMessage: 'boom' }));
      }),
    );
    const result = await getTrendingResources(1, date);
    expect(result).toMatchObject(mappedTrendingResources(mockedTrendingResources, dateKey));
  });
  it('fetches trending resources from Dynamodb', async () => {
    server.use(
      rest.get(GA_ENDPOINT, async (req, res, ctx) => {
        return res(ctx.status(403), ctx.json({ errorMessage: 'boom' }));
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
      rest.get(GA_ENDPOINT, async (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(emptyRows));
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
      rest.get(GA_ENDPOINT, async (req, res, ctx) => {
        return res(ctx.status(403), ctx.json({ errorMessage: 'boom' }));
      }),
    );
    const result = await getTrendingResources(1, date);
    expect(result).toStrictEqual([]);
  });
});

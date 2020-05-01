import nock from 'nock';
import { getTrendingResources, mappedTrendingResources } from '../google';
import {
  trendingResourcesResponse,
  mockedTrendingResources,
  fromDynamoDb,
} from '../../../mocks/google/trendingResources';

const mockedGetCache = jest.fn();
jest.mock('../cache', () => ({
  ...jest.requireActual('../cache'),
  getCache: () => mockedGetCache(),
  setCache: jest.fn(),
}));

const mockQueryReturn = jest.fn();
jest.mock('../../../db', () => ({
  ...jest.requireActual('../../../db'),
  query: () => mockQueryReturn(),
}));

const dateKey = new Date().toISOString().slice(0, 10);
const date = new Date();

describe('Google api module', () => {
  afterEach(() => nock.cleanAll());
  beforeEach(() => {
    nock('https://www.googleapis.com').persist().post('/oauth2/v4/token').reply(200, {});
    mockedGetCache.mockReturnValue(null);
    mockQueryReturn.mockResolvedValue({ Items: [] });
  });
  it('fetches trending resources from Google', async () => {
    mockQueryReturn.mockResolvedValue({ Items: fromDynamoDb(dateKey) });
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .reply(200, trendingResourcesResponse.data);
    const result = await getTrendingResources(1, date);
    expect(result).toMatchObject(mappedTrendingResources(mockedTrendingResources, dateKey));
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
    mockQueryReturn.mockResolvedValue({ Items: fromDynamoDb(dateKey) });
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .replyWithError('boom');
    const result = await getTrendingResources(1, date);
    expect(result).toMatchObject(mappedTrendingResources(mockedTrendingResources, dateKey));
  });
  it('returns an empty array when there are no trending resources to return', async () => {
    mockQueryReturn.mockResolvedValue({ Items: [] });
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
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .replyWithError('boom');
    const result = await getTrendingResources(1, date);
    expect(result).toStrictEqual([]);
  });
});

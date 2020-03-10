import nock from 'nock';
import { getTrendingResources } from '../google';
import trendingResourcesResponse from '../../../mocks/google/trendingResources';
import TrendingResource from '../../models/trendingResource';

const rows: string[][] = trendingResourcesResponse.data['rows'] as string[][]; // eslint-disable-line dot-notation
const objects = rows.map((r) => new TrendingResource(r[0], r[1], r[2], r[3]));

describe('Google api module', () => {
  beforeEach(() => {
    nock('https://www.googleapis.com').removeAllListeners();
    nock('https://www.googleapis.com')
      .persist()
      .post('/oauth2/v4/token')
      .reply(200, {});
  });
  it('fetches trending resources', async () => {
    nock('https://www.googleapis.com')
      .get('/analytics/v3/data/ga')
      .query(true)
      .reply(200, trendingResourcesResponse.data);
    const result = await getTrendingResources();
    expect(result).toMatchObject(objects);
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
    expect(await getTrendingResources()).toMatchObject([]);
  });
  it('handles an error response from google', async () => {
    nock('https://www.googleapis.com')
      .persist()
      .get('/analytics/v3/data/ga')
      .query(true)
      .replyWithError('boom');
    const result = await getTrendingResources();
    expect(result).toBeUndefined();
  });
});

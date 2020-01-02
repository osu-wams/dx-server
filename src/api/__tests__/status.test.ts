import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { mockedGetResponse, mockedGet } from '../modules/__mocks__/cache';
import componentsResponse, { expectedResponse } from '../../mocks/cachet/components';
import incidentsResponse from '../../mocks/cachet/incidents';

const CACHET_BASE_URL: string = config.get('cachetApi.baseUrl');
const request = supertest.agent(app);

/**
 * Use Nock to intercept API calls since this method fetches and combines multiple endpoints, which makes
 * it not currently possible to mock cache.get instead.
 */
beforeEach(() => {
  nock(CACHET_BASE_URL)
    .get('/components')
    .reply(200, componentsResponse);
  nock(CACHET_BASE_URL)
    .get('/incidents')
    .reply(200, incidentsResponse);
});

describe('/status', () => {
  it('returns the services statuses', async () => {
    await request.get('/api/status').expect(200, expectedResponse);
  });

  it('should return "Unable to retrieve alerts." when there is a 500 error', async () => {
    mockedGetResponse.mockReturnValue(undefined);
    cache.get = mockedGet;
    nock(CACHET_BASE_URL)
      .get('/components')
      .reply(500);

    await request.get('/api/status').expect(500, { message: 'Cachet API queries failed.' });
  });
});

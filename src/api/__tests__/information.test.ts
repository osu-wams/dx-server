import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import { infoData, filteredInfoData } from '../__mocks__/information.data';
import { BASE_URL } from '../modules/dx';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { setAsync, getAsync, mockCachedData } from '../modules/__mocks__/cache';

const request = supertest.agent(app);

describe('/info-buttons', () => {
  const INFO_ENDPOINT = `/jsonapi/node/information`;

  it('should fetch uncached data and then return reshaped data', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    cache.setAsync = setAsync;
    nock(BASE_URL)
      .get(INFO_ENDPOINT)
      .query(true)
      .reply(200, { data: infoData });
    await request.get(`/api/info-buttons`).expect(200, filteredInfoData);
  });
  it('should fetch cached data and then return reshaped data', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(infoData));
    cache.getAsync = getAsync;
    await request.get(`/api/info-buttons`).expect(200, filteredInfoData);
  });
  it('should return a 500 if the site is down', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL)
      .get(/.*/)
      .reply(500);

    await request.get('/api/info-buttons').expect(500);
  });
});

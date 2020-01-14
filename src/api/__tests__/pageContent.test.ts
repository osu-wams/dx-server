import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import pageContentJSON, { expectedPageContent } from '../../mocks/dx/page-content';
import { BASE_URL } from '../modules/dx';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { setAsync, getAsync, mockCachedData } from '../modules/__mocks__/cache';

const request = supertest.agent(app);

describe('/page-content', () => {
  const apiPath = '/api/page-content/beta';

  it('should fetch uncached data and then return reshaped data', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    cache.setAsync = setAsync;
    nock(BASE_URL)
      .get('/jsonapi/node/dashboard_content')
      .query(true)
      .reply(200, { data: pageContentJSON });
    await request.get(apiPath).expect(200, expectedPageContent);
  });

  it('should fetch cached data and then return reshaped data', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(pageContentJSON));
    cache.getAsync = getAsync;
    await request.get(apiPath).expect(200, expectedPageContent);
  });

  it('should return a 500 if the site is down', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL)
      .get(/.*/)
      .reply(500);

    await request.get(apiPath).expect(500);
  });
});

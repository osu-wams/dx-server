import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import releaseNotesJSON, { lastReleaseNote } from '../../mocks/dx/release-notes';
import { BASE_URL } from '../modules/dx';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { setAsync, getAsync, mockCachedData } from '../modules/__mocks__/cache';

const request = supertest.agent(app);

describe('/release-notes', () => {
  const apiPath = '/api/release-notes';

  it('should return only 6 current uncached data and then return reshaped data', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    cache.setAsync = setAsync;
    nock(BASE_URL)
      .get('/jsonapi/node/release_notes')
      .query(true)
      .reply(200, {
        // eslint-disable-next-line no-unused-vars
        data: [...Array(10)].map((_i) => releaseNotesJSON[0]),
      });
    await request.get(apiPath).expect(
      200,
      // eslint-disable-next-line no-unused-vars
      [...Array(6)].map((_i) => lastReleaseNote[0]),
    );
  });

  it('should fetch uncached data and then return reshaped data', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    cache.setAsync = setAsync;
    nock(BASE_URL)
      .get('/jsonapi/node/release_notes')
      .query(true)
      .reply(200, { data: releaseNotesJSON });
    await request.get(apiPath).expect(200, lastReleaseNote);
  });

  it('should fetch cached data and then return reshaped data', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(releaseNotesJSON));
    cache.getAsync = getAsync;
    await request.get(apiPath).expect(200, lastReleaseNote);
  });

  it('should return a 500 if the site is down', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(BASE_URL).get(/.*/).reply(500);

    await request.get(apiPath).expect(500);
  });
});

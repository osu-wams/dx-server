import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import { infoData, filteredInfoData } from '../__mocks__/information.data';
import { BASE_URL } from '../modules/dx';

const request = supertest.agent(app);

describe('/info-buttons', () => {
  const INFO_ENDPOINT = `/jsonapi/node/information`;

  it('should filter the data', async () => {
    nock(BASE_URL)
      .get(INFO_ENDPOINT)
      .query(true)
      .reply(200, infoData);
    await request.get(`/api/info-buttons`).expect(200, filteredInfoData);
  });
  it('should return a 500 if the site is down', async () => {
    nock(BASE_URL)
      .get(/.*/)
      .reply(500);

    await request.get('/api/info-buttons').expect(500);
  });
});

import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import app from '../../index';
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';

jest.mock('../util.ts');

const APIGEE_BASE_URL = config.get('osuApi.baseUrl');
let request: supertest.SuperTest<supertest.Test>;
beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/api/user', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });

  it('return user session data', async () => {
    const data = {
      id: 'id',
      attributes: {
        level: 'level',
        classification: 'classification',
        campus: 'campus',
        status: 'status',
        isInternational: false
      }
    };
    mockedGetResponse.mockReturnValue({ data });
    cache.get = mockedGet;
    nock(APIGEE_BASE_URL)
      .get(/v1\/students\/[0-9]+\/classification/)
      .reply(200, { data });

    await request.get('/api/user').expect(200, {
      osuId: 111111111,
      firstName: 'Test',
      lastName: 'User',
      email: 'fake-email@oregonstate.edu',
      isAdmin: true,
      isCanvasOptIn: true,
      classification: {
        id: 'id',
        attributes: {
          level: 'level',
          classification: 'classification',
          campus: 'campus',
          status: 'status',
          isInternational: false
        }
      }
    });
  });
});

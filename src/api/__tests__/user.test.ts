import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import app from '../../index';
import { UserSettings, GROUPS } from '../models/user'; // eslint-disable-line no-unused-vars
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';
import * as dynamoDb from '../../db';

jest.mock('../../db');
const mockDynamoDb = dynamoDb as jest.Mocked<any>; // eslint-disable-line no-unused-vars

jest.mock('../util.ts', () => ({
  ...jest.requireActual('../util.ts'),
  getToken: () => Promise.resolve('bearer token'),
}));

const APIGEE_BASE_URL: string = config.get('osuApi.baseUrl');
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
    await request.get('/api/user').expect(200, {
      osuId: 111111111,
      firstName: 'Test',
      lastName: 'User',
      email: 'fake-email@oregonstate.edu',
      isAdmin: true,
      groups: Object.keys(GROUPS),
      isCanvasOptIn: true,
      classification: {},
      audienceOverride: {},
    });
  });

  it('return user classification data', async () => {
    const data = {
      id: 'id',
      attributes: {
        level: 'level',
        classification: 'classification',
        campus: 'campus',
        status: 'status',
        isInternational: false,
      },
    };
    mockedGetResponse.mockReturnValue({ data });
    cache.get = mockedGet;
    nock(APIGEE_BASE_URL)
      .get(/v1\/students\/[0-9]+\/classification/)
      .reply(200, { data });

    await request.get('/api/user/classification').expect(200, {
      id: 'id',
      attributes: {
        level: 'level',
        classification: 'classification',
        campus: 'campus',
        status: 'status',
        isInternational: false,
      },
    });
  });

  describe('/settings', () => {
    const settings: UserSettings = {
      audienceOverride: {
        campusCode: 'C',
      },
    };

    it('updates audienceOverride settings', async () => {
      await request
        .post('/api/user/settings')
        .send(settings)
        .expect(200, { audienceOverride: { campusCode: 'C' }, theme: 'light' });
    });

    it('returns an error for failed audienceOverride settings', async () => {
      mockDynamoDb.updateItem.mockImplementationOnce(() =>
        Promise.reject(new Error('happy little accident')),
      );
      await request
        .post('/api/user/settings')
        .send(settings)
        .expect(500, { message: 'Failed to update users settings.' });
    });
  });
});

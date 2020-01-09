import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';
import {
  academicStatusData,
  classScheduleDataResponse,
  classScheduleDataResult,
  gpaDataResponse,
  gpaDataResult,
} from '../__mocks__/student.data';
import { holdsData } from '../__mocks__/holds.data';
import { plannerItemsData } from '../__mocks__/planner-items.data';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';
import mockUser from '../../utils/mock-user';
import { DYNAMODB_ENDPOINT } from '../../db/index';
import { GROUPS } from '../models/user';

jest.mock('../util.ts', () => ({
  ...jest.requireActual('../util.ts'),
  getToken: () => Promise.resolve('bearer token'),
}));
jest.mock('../../utils/mock-user.ts');

const mockedUser = mockUser as jest.Mocked<any>;

const user = {
  email: 'fake-email@oregonstate.edu',
  firstName: 'Test',
  lastName: 'User',
  permissions: [GROUPS.admin, GROUPS.masquerade],
  osuId: 111111111,
  isAdmin: true,
  groups: Object.keys(GROUPS),
  isCanvasOptIn: true,
  refreshToken: 'token',
  canvasOauthExpire: Date.now() + 1000 * 60 * 60 * 24,
  canvasOauthToken: 'token',
};

const APIGEE_BASE_URL: string = config.get('osuApi.baseUrl');
const CANVAS_BASE_URL: string = config.get<string>('canvasApi.baseUrl').replace('/api/v1', '');
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
  mockedUser.mockReturnValue(user);
  nock(DYNAMODB_ENDPOINT)
    .post(/.*/)
    .reply(200, {})
    .persist();
});

describe('/api/student', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
    cache.get = mockedGet;
  });

  describe('/academic-status', () => {
    it('should return academic status data for the current user', async () => {
      mockedGetResponse.mockReturnValue(academicStatusData);
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(true)
        .reply(200, academicStatusData);
      await request.get('/api/student/academic-status').expect(200, {
        academicStanding: 'Good Standing',
        term: '202001',
      });
    });

    it('should return data for a specified term', async () => {
      const data = [{ term: 'current' }, { term: '201901' }];
      mockedGetResponse.mockReturnValue({
        links: { self: 'bogus' },
        data: [academicStatusData.data[1]],
      });
      cache.get = mockedGet;

      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(data[1])
        .reply(200, { links: { self: 'bogus' }, data: [academicStatusData.data[1]] });

      // Get specified term
      await request.get('/api/student/academic-status?term=201901').expect(200, {
        academicStanding: 'Good Standing',
        term: '201901',
      });
    });

    it('should return data for the current term if none provided', async () => {
      mockedGetResponse.mockReturnValue(academicStatusData);
      cache.get = mockedGet;

      // Mock default (term=current) response
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(true)
        .reply(200, academicStatusData);

      // Get current term
      await request.get('/api/student/academic-status').expect(200, {
        academicStanding: 'Good Standing',
        term: '202001',
      });
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/student/academic-status').expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve academic status." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .reply(500);

      await request
        .get('/api/student/academic-status')
        .expect(500, { message: 'Unable to retrieve academic status.' });
    });
  });

  describe('/account-balance', () => {
    it('should return account balance data for the current user', async () => {
      const data = ['account-balance'];
      mockedGetResponse.mockReturnValue({ data });
      cache.get = mockedGet;

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/account-balance/)
        .reply(200, { data });

      await request.get('/api/student/account-balance').expect(200, data);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/student/account-balance').expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve account balance." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/account-balance/)
        .reply(500);

      await request
        .get('/api/student/account-balance')
        .expect(500, { message: 'Unable to retrieve account balance.' });
    });
  });

  describe('/account-transactions', () => {
    it('should return account transactions data for the current user', async () => {
      const data = ['account-transaction'];
      mockedGetResponse.mockReturnValue({ data });
      cache.get = mockedGet;

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/account-transactions/)
        .reply(200, { data });

      await request.get('/api/student/account-transactions').expect(200, data);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/student/account-transactions')
        .expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve account transactions." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/account-transactions/)
        .reply(500);

      await request
        .get('/api/student/account-transactions')
        .expect(500, { message: 'Unable to retrieve account transactions.' });
    });
  });

  describe('/classification', () => {
    it('should return classifications of the current user', async () => {
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

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/classification/)
        .reply(200, { data });

      await request.get('/api/student/classification').expect(200, data);
    });

    it('should return "Unable to retrieve classification." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/classification/)
        .reply(500);

      await request
        .get('/api/student/classification')
        .expect(500, { message: 'Unable to retrieve classification.' });
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/student/classification').expect(401, { message: 'Unauthorized' });
    });
  });

  describe('/class-schedule', () => {
    it('should return current term course schedule for the current user', async () => {
      mockedGetResponse.mockReturnValue(classScheduleDataResponse);
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/class-schedule/)
        .reply(200, classScheduleDataResponse);

      await request.get('/api/student/class-schedule').expect(200, classScheduleDataResult);
    });

    it('should return "Unable to retrieve class schedule." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/class-schedule/)
        .reply(500);

      await request
        .get('/api/student/class-schedule')
        .expect(500, { message: 'Unable to retrieve class schedule.' });
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/student/class-schedule').expect(401, { message: 'Unauthorized' });
    });
  });

  describe('/gpa', () => {
    it('should return GPA data for the current user', async () => {
      mockedGetResponse.mockReturnValue(gpaDataResponse);
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/gpa/)
        .reply(200, gpaDataResponse);

      await request.get('/api/student/gpa').expect(200, gpaDataResult);
    });

    it('should return no GPA data when none exists', async () => {
      gpaDataResponse.data.attributes.gpaLevels = [];
      mockedGetResponse.mockReturnValue(gpaDataResponse);
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/gpa/)
        .reply(200, gpaDataResponse);

      await request.get('/api/student/gpa').expect(200, []);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/student/class-schedule').expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve GPA data." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/gpa/)
        .reply(500);

      await request
        .get('/api/student/gpa')
        .expect(500, { message: 'Unable to retrieve GPA data.' });
    });
  });

  describe('/grades', () => {
    it('should return grades for the current user', async () => {
      const data = ['grades'];
      mockedGetResponse.mockReturnValue({ data });
      cache.get = mockedGet;

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/grades/)
        .query(true)
        .reply(200, { data });

      await request.get('/api/student/grades').expect(200, data);
    });

    it('should return grades for a specified term, or the current term if none provided', async () => {
      const data = [
        { attributes: { term: '201701' } },
        { attributes: { term: '201901' } },
        { attributes: { term: 'current' } },
        { attributes: { term: '201901' } },
        { attributes: { term: '201803' } },
      ];

      mockedGetResponse.mockReturnValue({ data: [data[0]] });
      cache.get = mockedGet;

      // Mock default (term=current) response
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/grades/)
        .query(data[0].attributes)
        .reply(200, { data: [data[0]] });

      await request.get('/api/student/grades?term=201701').expect(200, [data[0]]);
    });

    it('should return grades for a specified term, or the current term if none provided', async () => {
      const data = [
        { attributes: { term: '201701' } },
        { attributes: { term: '201901' } },
        { attributes: { term: 'current' } },
        { attributes: { term: '201901' } },
        { attributes: { term: '201803' } },
      ];

      const dataSorted = [
        { attributes: { term: 'current' } },
        { attributes: { term: '201901' } },
        { attributes: { term: '201901' } },
        { attributes: { term: '201803' } },
        { attributes: { term: '201701' } },
      ];
      mockedGetResponse.mockReturnValue({ data });
      cache.get = mockedGet;

      // Mock default (term=current) response
      nock(APIGEE_BASE_URL)
        // test sorted
        .get(/v1\/students\/[0-9]+\/grades/)
        .query(true)
        .reply(200, { data });

      await request.get('/api/student/grades').expect(200, dataSorted);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/student/grades').expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve grades." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/grades/)
        .reply(500);

      await request
        .get('/api/student/grades')
        .expect(500, { message: 'Unable to retrieve grades.' });
    });
  });

  describe('/holds', () => {
    it('should return account holds for the current user', async () => {
      mockedGetResponse.mockReturnValue(holdsData);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/holds/)
        .reply(200, holdsData);

      await request.get('/api/student/holds').expect(200, [{ description: 'Permanent Hold' }]);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/student/holds').expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve account holds." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/holds/)
        .reply(500);

      await request
        .get('/api/student/holds')
        .expect(500, { message: 'Unable to retrieve account holds.' });
    });
  });

  describe('/planner-items', () => {
    beforeEach(() => {
      nock(CANVAS_BASE_URL)
        .post('/login/oauth2/token')
        .query(true)
        .reply(200, { access_token: 'token', expires_in: Date.now() + 1000 * 60 * 60 * 24 });
      mockedUser.mockReturnValue(user);
    });
    it('should return planner items for the current user', async () => {
      nock(CANVAS_BASE_URL)
        .get('/api/v1/planner/items')
        .query(true)
        .reply(200, JSON.stringify(plannerItemsData));
      await request.get('/api/student/planner-items').expect(200, plannerItemsData);
    });
    it('should return an error', async () => {
      nock(CANVAS_BASE_URL)
        .get('/api/v1/planner/items')
        .query(true)
        .reply(500);
      await request
        .get('/api/student/planner-items')
        .expect(500, { message: 'Unable to retrieve planner items.' });
    });

    describe('with a masqueraded user', () => {
      beforeEach(async () => {
        nock(CANVAS_BASE_URL)
          .post('/login/oauth2/token')
          .query(true)
          .reply(200, { access_token: 'token', expires_in: Date.now() + 1000 * 60 * 60 * 24 });
        mockedUser.mockReturnValue({ ...user, masqueradeId: 111111111 });
        // login the user as masqueraded
        await request.get('/login');
      });
      it('should return planner items for the user', async () => {
        nock(CANVAS_BASE_URL)
          .get('/api/v1/planner/items')
          .query(true)
          .reply(200, JSON.stringify(plannerItemsData));
        await request.get('/api/student/planner-items').expect(200, plannerItemsData);
      });
    });

    describe('with an invalid canvas refresh token', () => {
      beforeEach(() => {
        mockedUser.mockReturnValue({ ...user, refreshToken: '', canvasOauthExpire: 0 });
      });
      it('should return an error', async () => {
        nock(CANVAS_BASE_URL)
          .get((uri) => uri.includes('items'))
          .query(true)
          .reply(401);
        await request
          .get('/api/student/planner-items')
          .expect(403, { message: 'Reset users canvas oauth.' });
      });
    });

    describe('with an expired or invalid Canvas oauth expiration', () => {
      beforeEach(() => {
        mockedUser.mockReturnValue({ ...user, canvasOauthExpire: 0 });
      });
      it('should return an error', async () => {
        nock(CANVAS_BASE_URL)
          .get('/api/v1/planner/items')
          .query(true)
          .reply(401);
        await request
          .get('/api/student/planner-items')
          .expect(403, { message: 'User must opt-in to Canvas login' });
      });
    });
  });
});

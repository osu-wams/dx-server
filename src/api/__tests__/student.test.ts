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
import mockDegrees from '../../mocks/osu/degrees.data.json';
import mockGrades from '../../mocks/osu/grades.data.json';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';
import mockUser from '../../utils/mock-user';
import { GROUPS, OSU_API_BASE_URL } from '../../constants';

jest.mock('../util.ts', () => ({
  ...jest.requireActual('../util.ts') as {},
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
  colleges: [],
  canvasOptIn: true,
  canvasRefreshToken: 'token',
  canvasOauthExpire: Date.now() + 1000 * 60 * 60 * 24,
  canvasOauthToken: 'token',
};

const CANVAS_BASE_URL: string = config.get<string>('canvasApi.baseUrl').replace('/api/v1', '');
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
  mockedUser.mockReturnValue(user);
});

describe('handle upstream 502 traffic retry', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });
  it('should try fetching again after a 502 from OSU api', async () => {
    nock(OSU_API_BASE_URL)
      .get(/v1\/students\/[0-9]+\/academic-status/)
      .query(true)
      .reply(502, {
        fault: {
          faultstring: 'Unexpected EOF at target',
          detail: { errorcode: 'messaging.adaptors.http.flow.UnexpectedEOFAtTarget' },
        },
      })
      .get(/v1\/students\/[0-9]+\/academic-status/)
      .query(true)
      .reply(200, academicStatusData);
    await request.get('/api/student/academic-status').expect(200, {
      academicStanding: 'Good Standing',
      term: '202001',
    });
  });

  it('should not retry fetching again after a 5xx other than 502 from OSU api', async () => {
    nock(OSU_API_BASE_URL)
      .get(/v1\/students\/[0-9]+\/academic-status/)
      .query(true)
      .reply(500, {
        fault: {
          faultstring: 'testing fault string',
          detail: { errorcode: 'just some error code' },
        },
      });
    await request.get('/api/student/academic-status').expect(500);
  });
});

describe('/api/student', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
    cache.get = mockedGet;
  });

  describe('/academic-status', () => {
    it('should return empty status data when the current academic standing is null', async () => {
      mockedGetResponse.mockReturnValue({
        links: { self: 'bogus' },
        data: [{ ...academicStatusData.data[1], academicStanding: null }],
      });
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(true)
        .reply(200, academicStatusData);
      await request.get('/api/student/academic-status').expect(200, {});
    });
    it('should return academic status data for the current user', async () => {
      mockedGetResponse.mockReturnValue(academicStatusData);
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(OSU_API_BASE_URL)
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

      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/classification/)
        .reply(200, { data });

      await request.get('/api/student/classification').expect(200, data);
    });

    it('should return "Unable to retrieve classification." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/class-schedule/)
        .reply(200, classScheduleDataResponse);

      await request.get('/api/student/class-schedule').expect(200, classScheduleDataResult);
    });

    it('should return "Unable to retrieve class schedule." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/gpa/)
        .reply(200, gpaDataResponse);

      await request.get('/api/student/gpa').expect(200, gpaDataResult);
    });

    it('should return no GPA data when none exists', async () => {
      gpaDataResponse.data.attributes.gpaLevels = [];
      mockedGetResponse.mockReturnValue(gpaDataResponse);
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/gpa/)
        .reply(500);

      await request
        .get('/api/student/gpa')
        .expect(500, { message: 'Unable to retrieve GPA data.' });
    });
  });

  describe('/grades', () => {
    const expectedGrades = mockGrades.data
      .map((g) => ({
        ...g,
        attributes: {
          ...g.attributes,
          courseSubjectNumber: `${g.attributes.courseSubject} ${g.attributes.courseNumber}`,
        },
      }))
      .sort((a: { attributes: { term: string } }, b: { attributes: { term: string } }): number => {
        if (!b) return 0;
        if (a.attributes.term < b.attributes.term) return 1;
        if (a.attributes.term > b.attributes.term) return -1;
        return 0;
      });
    it('should return grades for the current user', async () => {
      mockedGetResponse.mockReturnValue(mockGrades);
      cache.get = mockedGet;

      // Mock response from Apigee
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/grades/)
        .query(true)
        .reply(200, mockGrades);

      await request.get('/api/student/grades').expect(200, expectedGrades);
    });

    it('should return grades for a specified term, or the current term if none provided', async () => {
      mockedGetResponse.mockReturnValue({ data: [mockGrades.data[14]] });
      cache.get = mockedGet;

      // Mock default (term=current) response
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/grades/)
        .query({ term: '202001' })
        .reply(200, { data: [mockGrades.data[14]] });

      await request.get('/api/student/grades?term=202001').expect(200, [expectedGrades[0]]);
    });

    it('should return grades for a specified term, or the current term if none provided', async () => {
      const data = [
        {
          attributes: {
            term: '201701',
            courseSubject: 'BA',
            courseNumber: '101',
            courseSubjectNumber: 'BA 101',
          },
        },
        {
          attributes: {
            term: '201901',
            courseSubject: 'BA',
            courseNumber: '101',
            courseSubjectNumber: 'BA 101',
          },
        },
        {
          attributes: {
            term: 'current',
            courseSubject: 'BA',
            courseNumber: '101',
            courseSubjectNumber: 'BA 101',
          },
        },
      ];

      const dataSorted = [
        {
          attributes: {
            term: 'current',
            courseSubject: 'BA',
            courseNumber: '101',
            courseSubjectNumber: 'BA 101',
          },
        },
        {
          attributes: {
            term: '201901',
            courseSubject: 'BA',
            courseNumber: '101',
            courseSubjectNumber: 'BA 101',
          },
        },
        {
          attributes: {
            term: '201701',
            courseSubject: 'BA',
            courseNumber: '101',
            courseSubjectNumber: 'BA 101',
          },
        },
      ];
      mockedGetResponse.mockReturnValue({ data });
      cache.get = mockedGet;

      // Mock default (term=current) response
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
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
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/holds/)
        .reply(200, holdsData);

      await request
        .get('/api/student/holds')
        .expect(200, [
          {
            description: 'Permanent Hold',
            reason: 'got to pay',
            toDate: '2199-01-01',
            fromDate: '2021-12-05',
          },
        ]);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/student/holds').expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve account holds." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/holds/)
        .reply(500);

      await request
        .get('/api/student/holds')
        .expect(500, { message: 'Unable to retrieve account holds.' });
    });
  });

  describe('/degrees', () => {
    it('should return an empty array when no degree data is found', async () => {
      mockedGetResponse.mockReturnValue({ data: [] });
      cache.get = mockedGet;

      // Mock response from Apigee
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/degrees/)
        .reply(200, { data: [] });

      await request.get('/api/student/degrees').expect(200, []);
    });

    it('should return "Unable to retrieve degrees." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(OSU_API_BASE_URL)
        .get(/v1\/students\/[0-9]+\/degrees/)
        .reply(500);

      await request
        .get('/api/student/degrees')
        .expect(500, { message: 'Unable to retrieve degree information.' });
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/student/degrees').expect(401, { message: 'Unauthorized' });
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
      it('should return degrees but not update the users colleges ', async () => {
        mockedGetResponse.mockReturnValue(mockDegrees);
        cache.get = mockedGet;

        // Mock response from Apigee
        nock(OSU_API_BASE_URL)
          .get(/v1\/students\/[0-9]+\/degrees/)
          .reply(200, { data: mockDegrees });

        await request.get('/api/student/degrees').expect(200, mockDegrees.data);
      });

      it('if a student has a certificate degree, should not contain (in) ', async () => {
        mockedGetResponse.mockReturnValue({
          ...mockDegrees,
          data: [{ attributes: { degree: ['Certificate in', 'Certificate in'] } }],
        });
        cache.get = mockedGet;

        // Mock response from Apigee
        nock(OSU_API_BASE_URL)
          .get(/v1\/students\/[0-9]+\/degrees/)
          .reply(200, {
            data: [
              { ...mockDegrees, attributes: { degree: ['Certificate in', 'Certificate in'] } },
            ],
          });

        await request.get('/api/student/degrees').expect(200, [
          {
            attributes: { degree: ['Certificate in', 'Certificate in'] },
          },
        ]);
      });
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
    it('should return planner items that have not been marked complete', async () => {
      const completedPlannerItem = [
        plannerItemsData[0],
        { ...plannerItemsData[1], planner_override: { marked_complete: true, dismissed: false } },
      ];
      nock(CANVAS_BASE_URL)
        .get('/api/v1/planner/items')
        .query(true)
        .reply(200, JSON.stringify(completedPlannerItem));
      await request.get('/api/student/planner-items').expect(200, [plannerItemsData[0]]);
    });
    it('should return planner items that have not been dismissed', async () => {
      const completedPlannerItem = [
        plannerItemsData[0],
        { ...plannerItemsData[1], planner_override: { marked_complete: false, dismissed: true } },
      ];
      nock(CANVAS_BASE_URL)
        .get('/api/v1/planner/items')
        .query(true)
        .reply(200, JSON.stringify(completedPlannerItem));
      await request.get('/api/student/planner-items').expect(200, [plannerItemsData[0]]);
    });
    it('should return planner items that have not been dismissed and marked complete', async () => {
      const completedPlannerItem = [
        plannerItemsData[0],
        { ...plannerItemsData[1], planner_override: { marked_complete: true, dismissed: true } },
      ];
      nock(CANVAS_BASE_URL)
        .get('/api/v1/planner/items')
        .query(true)
        .reply(200, JSON.stringify(completedPlannerItem));
      await request.get('/api/student/planner-items').expect(200, [plannerItemsData[0]]);
    });
    it('should return an error', async () => {
      nock(CANVAS_BASE_URL).get('/api/v1/planner/items').query(true).reply(500);
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
      it('should return an error', async () => {
        nock(CANVAS_BASE_URL)
          .get((uri) => uri.includes('items'))
          .query(true)
          .reply(401, { blah: 'blah' });
        await request
          .get('/api/student/planner-items')
          .expect(403, { message: 'Reset users canvas oauth.' });
      });
    });

    describe('with an expired or invalid Canvas oauth expiration', () => {
      beforeEach(async () => {
        supertest.agent(app);
        mockedUser.mockReturnValue({
          ...user,
          canvasOauthExpire: 0,
          canvasOptIn: false,
          canvasRefreshToken: '',
        });
        // Authenticate before each request
        await request.get('/login');
      });
      it('should return an error', async () => {
        await request
          .get('/api/student/planner-items')
          .expect(403, { message: 'User must opt-in to Canvas login' });
      });
    });
  });
});

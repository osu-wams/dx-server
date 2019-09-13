import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';
import {
  academicStatusData,
  classScheduleDataResponse,
  classScheduleDataResult
} from '../__mocks__/student.data';
import { holdsData } from '../__mocks__/holds.data';

jest.mock('../util.ts');

const APIGEE_BASE_URL = config.get('osuApi.baseUrl');
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/api/student', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });

  describe('/academic-status', () => {
    it('should return academic status data for the current user', async () => {
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(true)
        .reply(200, academicStatusData);
      await request.get('/api/student/academic-status').expect(200, {
        academicStanding: 'Good Standing',
        term: '202001'
      });
    });

    it('should return data for a specified term, or the current term if none provided', async () => {
      const data = [{ term: 'current' }, { term: '201901' }];

      // Mock default (term=current) response
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(true)
        .reply(200, academicStatusData)
        // Mock specified term response
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(data[1])
        .reply(200, { links: { self: 'bogus' }, data: [academicStatusData.data[0]] });

      // Get current term
      await request.get('/api/student/academic-status').expect(200, {
        academicStanding: 'Good Standing',
        term: '202001'
      });

      // Get specified term
      await request.get('/api/student/academic-status?term=201901').expect(200, {
        academicStanding: 'Good Standing',
        term: '201901'
      });
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/student/academic-status')
        .expect(401)
        .expect(res => res.error.text === 'Unauthorized');
    });

    it('should return "Unable to retrieve academic status." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .reply(500);

      await request
        .get('/api/student/academic-status')
        .expect(500)
        .expect(res => res.error.text === 'Unable to retrieve academic status.');
    });
  });

  describe('/account-balance', () => {
    it('should return account balance data for the current user', async () => {
      const data = ['account-balance'];

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/account-balance/)
        .reply(200, { data });

      await request.get('/api/student/account-balance').expect(200, data);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/student/account-balance')
        .expect(401)
        .expect('Unauthorized');
    });

    it('should return "Unable to retrieve account balance." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/account-balance/)
        .reply(500);

      await request
        .get('/api/student/account-balance')
        .expect(500)
        .expect('Unable to retrieve account balance.');
    });
  });

  describe('/account-transactions', () => {
    it('should return account transactions data for the current user', async () => {
      const data = ['account-transaction'];

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
        .expect(401)
        .expect('Unauthorized');
    });

    it('should return "Unable to retrieve account transactions." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/account-transactions/)
        .reply(500);

      await request
        .get('/api/student/account-transactions')
        .expect(500)
        .expect('Unable to retrieve account transactions.');
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
          isInternational: false
        }
      };

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/classification/)
        .reply(200, { data });

      await request.get('/api/student/classification').expect(200, data);
    });

    it('should return "Unable to retrieve classification." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/classification/)
        .reply(500);

      await request
        .get('/api/student/classification')
        .expect(500)
        .expect('Unable to retrieve classification.');
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/student/classification')
        .expect(401)
        .expect('Unauthorized');
    });
  });

  describe('/class-schedule', () => {
    it('should return current term course schedule for the current user', async () => {
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/class-schedule/)
        .reply(200, classScheduleDataResponse);

      await request.get('/api/student/class-schedule').expect(200, classScheduleDataResult);
    });

    it('should return "Unable to retrieve class schedule." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/class-schedule/)
        .reply(500);

      await request
        .get('/api/student/class-schedule')
        .expect(500)
        .expect('Unable to retrieve class schedule.');
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/student/class-schedule')
        .expect(401)
        .expect('Unauthorized');
    });
  });

  describe('/gpa', () => {
    it('should return GPA data for the current user', async () => {
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/gpa/)
        .reply(200, {
          data: { attributes: { gpaLevels: [{ gpa: '3.2', gpaType: 'institution' }] } }
        });

      await request.get('/api/student/gpa').expect(200, { gpa: '3.2' });
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/student/class-schedule')
        .expect(401)
        .expect('Unauthorized');
    });

    it('should return "Unable to retrieve GPA data." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/gpa/)
        .reply(500);

      await request
        .get('/api/student/gpa')
        .expect(500)
        .expect('Unable to retrieve GPA data.');
    });
  });

  describe('/grades', () => {
    it('should return grades for the current user', async () => {
      const data = ['grades'];

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
        { attributes: { term: '201803' } }
      ];

      const dataSorted = [
        { attributes: { term: 'current' } },
        { attributes: { term: '201901' } },
        { attributes: { term: '201901' } },
        { attributes: { term: '201803' } },
        { attributes: { term: '201701' } }
      ];

      // Mock default (term=current) response
      nock(APIGEE_BASE_URL)
        // test sorted
        .get(/v1\/students\/[0-9]+\/grades/)
        .query(true)
        .reply(200, { data })
        // Mock specified term response
        .get(/v1\/students\/[0-9]+\/grades/)
        .query(data[0].attributes)
        .reply(200, { data: [data[0]] });

      await request.get('/api/student/grades').expect(200, dataSorted);
      await request.get('/api/student/grades?term=201701').expect(200, [data[0]]);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/student/grades')
        .expect(401)
        .expect('Unauthorized');
    });

    it('should return "Unable to retrieve grades." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/grades/)
        .reply(500);

      await request
        .get('/api/student/grades')
        .expect(500)
        .expect('Unable to retrieve grades.');
    });
  });

  describe('/holds', () => {
    it('should return account holds for the current user', async () => {
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/holds/)
        .reply(200, holdsData);

      await request.get('/api/student/holds').expect(200, [{ description: 'Permanent Hold' }]);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/student/holds')
        .expect(401)
        .expect('Unauthorized');
    });

    it('should return "Unable to retrieve account holds." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/holds/)
        .reply(500);

      await request
        .get('/api/student/holds')
        .expect(500)
        .expect('Unable to retrieve account holds.');
    });
  });
});

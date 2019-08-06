import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';

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
      const data = ['academic-status'];

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(true)
        .reply(200, { data });
      await request.get('/api/student/academic-status').expect(200, data);
    });

    it('should return data for a specified term, or the current term if none provided', async () => {
      const data = [{ term: 'current' }, { term: '201701' }];

      // Mock default (term=current) response
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(true)
        .reply(200, { data: data[0] })
        // Mock specified term response
        .get(/v1\/students\/[0-9]+\/academic-status/)
        .query(data[1])
        .reply(200, { data: data[1] });

      // Get current term
      await request.get('/api/student/academic-status').expect(200, data[0]);

      // Get specified term
      await request.get('/api/student/academic-status?term=201701').expect(200, data[1]);
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

  describe('/class-schedule', () => {
    it('should return current term course schedule for the current user', async () => {
      const data = ['class-schedule'];

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/class-schedule/)
        .reply(200, { data });

      await request.get('/api/student/class-schedule').expect(200, data);
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
      const data = ['gpa'];

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/gpa/)
        .reply(200, { data: ['gpa'] });

      await request.get('/api/student/gpa').expect(200, data);
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
      const data = [{ term: '201701' }, { term: 'current' }];

      // Mock default (term=current) response
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/grades/)
        .query(true)
        .reply(200, { data: data[1] })
        // Mock specified term response
        .get(/v1\/students\/[0-9]+\/grades/)
        .query(data[0])
        .reply(200, { data: data[0] });

      await request.get('/api/student/grades').expect(200, data[1]);

      await request.get('/api/student/grades?term=201701').expect(200, data[0]);
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
      const data = ['holds'];

      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/v1\/students\/[0-9]+\/holds/)
        .reply(200, { data });

      await request.get('/api/student/holds').expect(200, data);
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

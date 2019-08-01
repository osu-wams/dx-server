import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';
import { JobsMockResponse } from '../__mocks__/jobs-response';

const HANDSHAKE_BASE_URL = config.get('handshakeApi.baseUrl');
let request = supertest.agent(app);

describe('/api/jobs', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });

  describe('/jobs', () => {
    it('should return a list of jobs', async () => {
      // Mock response from Handshake - query parameters must be an exact match
      nock(HANDSHAKE_BASE_URL)
        .get(/jobs/)
        .query({
          per_page: 50
        })
        .reply(200, {
          success: true,
          jobs: JobsMockResponse
        });

      await request.get('/api/jobs').expect(200, { success: true, jobs: JobsMockResponse });
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/jobs')
        .expect(401)
        .expect(r => r.error.text === 'Unauthorized');
    });
  });
});

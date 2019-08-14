import supertest from 'supertest';
import app from '../../index';

jest.mock('redis');
jest.mock('../util.ts');

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/admin', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });

  it('should return success', async () => {
    await request
      .get('/api/admin/reset-sessions')
      .expect(200, 'Tokens reset, session cache is clearing.');
  });

  it('should return an error', async () => {
    // mock a dynamodb method call that will simulate an error to handle
    await request.get('/api/admin/reset-sessions').expect(500, 'Error while resetting sessions.');
  });
});

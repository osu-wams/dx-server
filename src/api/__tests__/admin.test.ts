import supertest from 'supertest';
import app from '../../index';
import * as database from '../../db';

jest.mock('redis');
jest.mock('../util.ts');
jest.mock('../../db/index.ts');

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
    // mock a method call that will simulate an error to handle
    const pool = database.pool as jest.Mocked<any>;
    pool.query.mockImplementation(() => {
      throw new Error('something broke!');
    });
    await request.get('/api/admin/reset-sessions').expect(500, 'Error while resetting sessions.');
  });
});

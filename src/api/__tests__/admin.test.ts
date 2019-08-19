import supertest from 'supertest';
import app from '../../index';
import User from '../models/user';

jest.mock('redis');
jest.mock('../util.ts');
jest.mock('../models/user.ts');

let request: supertest.SuperTest<supertest.Test>;
const mockedUser = User as jest.Mocked<any>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/admin', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });

  it('should return success', async () => {
    // mock a dynamodb method call that will simulate a successful process
    mockedUser.clearAllCanvasRefreshTokens.mockImplementation(() => {
      return [true, []];
    });
    await request
      .get('/api/admin/reset-sessions')
      .expect(200, 'Tokens reset, session cache is clearing.');
  });

  it('should return an error', async () => {
    // mock a dynamodb method call that will simulate an error to handle
    mockedUser.clearAllCanvasRefreshTokens.mockImplementation(() => {
      return [false, []];
    });
    await request.get('/api/admin/reset-sessions').expect(500, 'Error while resetting sessions.');
  });
});

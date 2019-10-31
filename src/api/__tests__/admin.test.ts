import supertest from 'supertest';
import app from '../../index';
import User from '../models/user';
import cache from '../modules/cache';
import { mockedFlushDb, mockedFlushDbResponse } from '../modules/__mocks__/cache';

jest.mock('redis');
jest.mock('../util.ts');
jest.mock('../models/user.ts');
jest.mock('../modules/cache.ts');

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

  describe('reset-sessions', () => {
    it('should return success', async () => {
      // mock a dynamodb method call that will simulate a successful process
      mockedUser.clearAllCanvasRefreshTokens.mockImplementation(() => {
        return [true, []];
      });
      await request
        .get('/api/admin/reset-sessions')
        .expect(200, { message: 'Tokens reset, session cache is clearing.' });
    });

    it('should return an error', async () => {
      // mock a dynamodb method call that will simulate an error to handle
      mockedUser.clearAllCanvasRefreshTokens.mockImplementation(() => {
        return [false, []];
      });
      await request
        .get('/api/admin/reset-sessions')
        .expect(500, { message: 'Error while resetting sessions.' });
    });
  });

  describe('reset-api-cache', () => {
    it('should return success', async () => {
      mockedFlushDbResponse.mockReturnValue(true);
      cache.flushDb = mockedFlushDb;
      await request
        .get('/api/admin/reset-api-cache')
        .expect(200, { message: 'Api cache is resetting.' });
    });
    it('should return unsuccessful', async () => {
      mockedFlushDbResponse.mockReturnValue(false);
      cache.flushDb = mockedFlushDb;
      await request.get('/api/admin/reset-api-cache').expect(304);
    });
    it('should return an error', async () => {
      mockedFlushDbResponse.mockReturnValue(undefined);
      cache.flushDb = () => {
        throw new Error();
      };
      await request
        .get('/api/admin/reset-api-cache')
        .expect(500, { message: 'Error while resetting api cache.' });
    });
  });
});

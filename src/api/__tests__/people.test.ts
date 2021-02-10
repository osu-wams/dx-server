import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import * as directoryData from '../../mocks/osu/directory.data.json';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { getAsync, selectDbAsync, mockCachedData } from '../modules/__mocks__/cache';
import { OSU_API_BASE_URL } from '../../constants';

jest.mock('../util.ts', () => ({
  ...jest.requireActual('../util.ts'),
  getToken: () => Promise.resolve('bearer token'),
}));

const APIGEE_BASE_URL: string = `${OSU_API_BASE_URL}/v2`;
const request = supertest.agent(app);

cache.getAsync = getAsync;
cache.selectDbAsync = selectDbAsync;

describe('/api/people', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('with data', () => {
    beforeEach(() => {
      mockCachedData.mockReturnValueOnce(directoryData);
      nock(APIGEE_BASE_URL)
        .get(/directory/)
        .query(true)
        .once()
        .reply(200, directoryData);
    });
    it('should return people general information', async () => {
      const response = await request.get('/api/people/ross');
      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual([
        {
          id: '987',
          firstName: 'Steve',
          lastName: 'Ross',
          department: 'Mechanical Engineering',
        },
        {
          id: '123',
          firstName: 'Bob',
          lastName: 'Ross',
          department: 'Acad Prog / Student Aff',
        },
      ]);
    });
  });

  describe('with errors', () => {
    beforeEach(() => {
      mockCachedData.mockReturnValue(undefined);
    });
    it('should return when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/directory/)
        .query(true)
        .once()
        .reply(500);

      await request.get('/api/people/ross').expect(500, '');
    });

    it('should return when there is a broad search', async () => {
      nock(APIGEE_BASE_URL)
        .get(/directory/)
        .query(true)
        .once()
        .reply(
          400,
          JSON.stringify({
            errors: [{ code: '1400', detail: 'Size Limit Exceeded (search too broad)' }],
          }),
        );

      await request.get('/api/people/lee').expect(400, 'Size Limit Exceeded (search too broad)');
    });
  });
});

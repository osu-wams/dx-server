import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import * as directoryData from '../../mocks/osu/directory.data.json';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';
import { OSU_API_BASE_URL } from '../../constants';

jest.mock('../util.ts', () => ({
  ...jest.requireActual('../util.ts'),
  getToken: () => Promise.resolve('bearer token'),
}));

const APIGEE_BASE_URL: string = `${OSU_API_BASE_URL}/v2`;
const request = supertest.agent(app);

describe('/api/people', () => {
  describe('/', () => {
    it('should return people general information', async () => {
      mockedGetResponse.mockReturnValue(directoryData);
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/directory\?*/)
        .query(true)
        .reply(200, directoryData);

      const response = await request.get('/api/people/ross');
      expect(response.status).toEqual(200);

      expect(response.body).toStrictEqual([
        {
          id: '123',
          firstName: 'Bob',
          lastName: 'Ross',
          department: 'Acad Prog / Student Aff',
        },
        {
          id: '987',
          firstName: 'Steve',
          lastName: 'Ross',
          department: 'Mechanical Engineering',
        },
      ]);
    });

    it('should return "Unable to retrieve directory information." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/directory\?*/)
        .reply(500);

      await request
        .get('/api/people/ross')
        .expect(500, { message: 'Unable to retrieve directory information.' });
    });
  });
});

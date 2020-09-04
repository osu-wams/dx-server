import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import * as personsData from '../../mocks/osu/persons.data.json';
import {
  personsAddressesData,
  personsMailingAddressData,
} from '../__mocks__/persons-addresses.data';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';
import { OSU_API_BASE_URL } from '../../constants';

jest.mock('../util.ts', () => ({
  ...jest.requireActual('../util.ts'),
  getToken: () => Promise.resolve('bearer token'),
}));

const APIGEE_BASE_URL: string = `${OSU_API_BASE_URL}/v1`;
let request = supertest.agent(app);

describe('/api/persons', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });

  describe('/', () => {
    it('should return person general information', async () => {
      mockedGetResponse.mockReturnValue(personsData);
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]/)
        .query(true)
        .reply(200, personsData);

      const response = await request.get('/api/persons/');
      expect(response.status).toEqual(200);

      expect(response.body).toStrictEqual({
        ...personsData.data.attributes,
        id: personsData.data.id,
      });
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/persons/').expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve person information." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]/)
        .reply(500);

      await request
        .get('/api/persons')
        .expect(500, { message: 'Unable to retrieve person information.' });
    });
  });

  // Addresses
  describe('/addresses', () => {
    it('should return the mailing address only', async () => {
      mockedGetResponse.mockReturnValue(personsAddressesData);
      cache.get = mockedGet;
      // Mock response from apigee
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]+\/addresses/)
        .query(true)
        .reply(200, personsAddressesData);

      await request.get('/api/persons/addresses').expect(200, personsMailingAddressData);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/persons/addresses').expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve addresses" when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]+\/addresses/)
        .reply(500);

      await request
        .get('/api/persons/addresses')
        .expect(500, { message: 'Unable to retrieve addresses' });
    });
  });

  // Meal Plan Balances
  describe('/meal-plans', () => {
    it('should return meal plans', async () => {
      mockedGetResponse.mockReturnValue({ data: { plan: 'Orange Rewards' } });
      cache.get = mockedGet;
      // Mock response from apigee
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]+\/meal-plans/)
        .query(true)
        .reply(200, { data: { plan: 'Orange Rewards' } });

      await request.get('/api/persons/meal-plans').expect(200, { plan: 'Orange Rewards' });
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request.get('/api/persons/meal-plans').expect(401, { message: 'Unauthorized' });
    });

    it('should return "Unable to retrieve meal plans." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]+\/meal-plans/)
        .reply(500);

      await request
        .get('/api/persons/meal-plans')
        .expect(500, { message: 'Unable to retrieve meal plans.' });
    });
  });
});

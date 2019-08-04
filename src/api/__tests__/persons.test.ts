import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';
import { personsData } from '../__mocks__/persons.data';
import {
  personsAddressesData,
  personsMailingAddressData
} from '../__mocks__/persons-addresses.data';

jest.mock('../util.ts');

const APIGEE_BASE_URL = config.get('osuApi.baseUrl');
let request = supertest.agent(app);

describe('/api/persons', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });

  describe('/', () => {
    it('should return person general information', async () => {
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]/)
        .query(true)
        .reply(200, personsData);

      await request.get('/api/persons/').expect(200, personsData.data);
    });

    it('should return an error if the user is not logged in', async () => {
      // Clear session data - we don't want to be logged in
      request = supertest.agent(app);

      await request
        .get('/api/persons/')
        .expect(401)
        .expect(r => r.error.text === 'Unauthorized');
    });

    it('should return "Unable to retrieve person information." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]/)
        .reply(500);

      await request
        .get('/api/persons')
        .expect(500)
        .expect(r => r.error.text === 'Unable to retrieve person information.');
    });
  });

  // Addresses
  describe('/addresses', () => {
    it('should return the mailing address only', async () => {
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

      await request
        .get('/api/persons/addresses')
        .expect(401)
        .expect(r => r.error.text === 'Unauthorize');
    });

    it('should return "Unable to retrieve addresses" when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]+\/addresses/)
        .reply(500);

      await request
        .get('/api/persons/addresses')
        .expect(500)
        .expect(r => r.error.text === 'Unable to retrieve addresses');
    });
  });

  // Meal Plan Balances
  describe('/meal-plans', () => {
    it('should return meal plans', async () => {
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

      await request
        .get('/api/persons/meal-plans')
        .expect(401)
        .expect(r => r.error.text === 'Unauthorized');
    });

    it('should return "Unable to retrieve meal plans." when there is a 500 error', async () => {
      nock(APIGEE_BASE_URL)
        .get(/persons\/[0-9]+\/meal-plans/)
        .reply(500);

      await request
        .get('/api/persons/meal-plans')
        .expect(500)
        .expect(r => r.error.text === 'Unable to retrieve meal plans.');
    });
  });
});
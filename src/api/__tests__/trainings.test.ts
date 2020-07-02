import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { setAsync, getAsync, mockCachedData } from '../modules/__mocks__/cache';
import {
  mockedTrainingTypes,
  mockedTrainingTypesExpected,
  mockedTrainings,
  mockedTrainingsExpected,
} from '../../mocks/dx';
import { BASE_URL } from '../modules/dx';

const mockedSetCache = jest.fn();
const mockedGetCache = jest.fn();
jest.mock('../modules/cache.ts', () => ({
  ...jest.requireActual('../modules/cache.ts'),
  setCache: () => mockedSetCache(),
  selectDbAsync: () => jest.fn(),
  getCache: () => mockedGetCache(),
}));

const request = supertest.agent(app);

describe('/api/trainings', () => {
  it('returns the trainings', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    cache.setAsync = setAsync;
    nock(BASE_URL)
      .get(/node\/trainings/)
      .reply(200, { data: mockedTrainings });
    const result = await request.get('/api/trainings');
    expect(result.ok).toBeTruthy();
    expect(result.body).toStrictEqual(mockedTrainingsExpected);
  });

  it('should return when there is a 500 error', async () => {
    nock(BASE_URL).get(/.*/).reply(500);
    await request.get('/api/trainings').expect(500, { message: 'Trainings API queries failed.' });
  });
});

describe('/api/trainings/types', () => {
  it('returns the training types', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    cache.setAsync = setAsync;
    nock(BASE_URL).get(/.*/).reply(200, { data: mockedTrainingTypes });
    const result = await request.get('/api/trainings/types');
    expect(result.ok).toBeTruthy();
    expect(result.body).toStrictEqual(mockedTrainingTypesExpected);
  });

  it('should return when there is a 500 error', async () => {
    nock(BASE_URL).get(/.*/).reply(500);
    await request
      .get('/api/trainings/types')
      .expect(500, { message: 'Training Types API queries failed.' });
  });
});

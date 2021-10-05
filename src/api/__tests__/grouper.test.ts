import supertest from 'supertest';
import app from '../../index';
import { covidvacStudentData } from '../__mocks__/grouper.data';
import { mocked } from 'ts-jest/utils';
import { asyncTimedFunction } from '../../tracer';

jest.mock('../../tracer');
const mockedAsync = mocked(asyncTimedFunction, true);

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/api/grouper', () => {
  it('API should return data from async call', async () => {
    mockedAsync.mockResolvedValue(covidvacStudentData);

    await request.get('/api/grouper?group=covidvac-student').expect(200, covidvacStudentData);
    expect(mockedAsync).toHaveBeenCalledTimes(1);
  });

  it('Should return 500 error for invalid grouper group', async () => {
    await request.get('/api/grouper?group=asdfadsf').expect(400);
  })
});

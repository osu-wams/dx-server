import supertest from 'supertest';
import { mocked } from 'ts-jest/utils';
import app from '../../index';
import { covidvacStudentData } from '../__mocks__/grouper.data';
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

describe('/api/grouper/hasMember', () => {
  it('API should return data from asnyc call', async () => {
    // MOCK 2 DIFFERENT VALUES
    mockedAsync.mockResolvedValueOnce({ attributes: { onid: 'test' }});
    mockedAsync.mockResolvedValueOnce({ IS_MEMBER: true });

    await request.get('/api/grouper/hasMember?group=covidvac-student').expect(200, { IS_MEMBER: true });
    expect(mockedAsync).toHaveBeenCalledTimes(2);
  });
});

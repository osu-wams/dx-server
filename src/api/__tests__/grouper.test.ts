import supertest from 'supertest';
import { mocked } from 'ts-jest/utils';
import app from '../../index';
import { asyncTimedFunction } from '../../tracer';

jest.mock('../../tracer');
const mockedAsync = mocked(asyncTimedFunction, true);

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/api/grouper/hasMember', () => {
  it('API should return data from asnyc call', async () => {
    const expectedResult = { IS_MEMBER: true };
    // MOCK 2 DIFFERENT VALUES
    mockedAsync.mockResolvedValueOnce({ attributes: { onid: 'test' }});
    mockedAsync.mockResolvedValueOnce(expectedResult);

    await request.get('/api/grouper/hasMember?group=covidvac-student').expect(200, expectedResult);
    expect(mockedAsync).toHaveBeenCalledTimes(2);
  });

  it('Should return 400 error for invalid grouper group', async () => {
    await request.get('/api/grouper/hasMember?group=asdfadsf').expect(400);
  })
});

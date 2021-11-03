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
beforeEach(async () => {
  // Authenticate before each request
  await request.get('/login');
  // mock first response which will return the person data
  mockedAsync.mockResolvedValueOnce({ attributes: { onid: 'test' }});
});

describe('/api/grouper/hasMember', () => {
  it('API should return data from asnyc call', async () => {
    const expectedResult = { IS_MEMBER: true };
    mockedAsync.mockResolvedValueOnce(expectedResult);

    await request.get('/api/grouper/hasMember?group=covidvac-student').expect(200, expectedResult);
    expect(mockedAsync).toHaveBeenCalledTimes(2);
  });

  it('Should return 400 error for invalid grouper group', async () => {
    await request.get('/api/grouper/hasMember?group=asdfadsf').expect(400);
  })
});

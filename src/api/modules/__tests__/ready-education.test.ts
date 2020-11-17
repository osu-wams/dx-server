/* eslint-disable no-unused-vars */

import nock from 'nock';
import { getUser, BASE_URL } from '../ready-education';
import mockedStudent from '../../../mocks/ready-education/student.data';

const mockToken = 'abc';

beforeEach(() => {
  nock(BASE_URL).get(`/public/v1/user/?user_token=${mockToken}`).reply(200, mockedStudent);
});

describe('Ready Education authentication module', () => {
  it('fetches student information', async () => {
    expect(await getUser(mockToken)).toMatchObject(mockedStudent);
  });
});

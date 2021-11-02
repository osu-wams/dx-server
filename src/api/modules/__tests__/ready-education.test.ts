/* eslint-disable no-unused-vars */

import { getUser } from '../ready-education';
import mockedStudent from '../../../mocks/ready-education/student.data';

const mockToken = 'abc';

describe('Ready Education authentication module', () => {
  it('fetches student information', async () => {
    expect(await getUser(mockToken)).toMatchObject(mockedStudent);
  });
});

/* eslint-disable no-unused-vars */
export const mockUser = {
  osuId: 123456,
  firstName: 'Bob',
  lastName: 'Ross',
  email: 'bob@bobross.com',
  phone: '5551212',
  isAdmin: false,
  primaryAffiliation: 'employee',
};

export const mockInsertReturn = mockUser;
export const mockUpdateCanvasDataReturn = mockUser;
export const mockFindReturn = mockUser;

export const User = {
  find: jest.fn((id: number) => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        if (mockFindReturn) resolve(mockFindReturn);
        else reject(new Error('happy little accident'));
      });
    });
  }),
  upsert: jest.fn((u: any) => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        if (mockInsertReturn) resolve(mockInsertReturn);
        else reject(new Error('happy little accident'));
      });
    });
  }),
  updateCanvasData: jest.fn((user: any, oAuthData: any) => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        if (mockUpdateCanvasDataReturn) resolve(mockUpdateCanvasDataReturn);
        else reject(new Error('happy little accident'));
      });
    });
  }),
  clearAllCanvasRefreshTokens: jest.fn(() => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        resolve([true, []]);
      });
    });
  }),
};
export default User;

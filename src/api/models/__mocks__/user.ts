import { lastLogin } from '../../../utils/auth';

/* eslint-disable no-unused-vars */
export const mockUser: any = {
  osuId: 123456,
  firstName: 'Bob',
  lastName: 'Ross',
  email: 'bob@bobross.com',
  phone: '5551212',
  primaryAffiliation: 'employee',
  affiliations: ['employee'],
  canvasRefreshToken: 'refresh-me',
  canvasOptIn: true,
  onid: 'rossb',
  lastLogin: lastLogin(),
};

export const mockDynamoDbUser = {
  osuId: { N: `${mockUser.osuId}` },
  firstName: { S: mockUser.firstName },
  lastName: { S: mockUser.lastName },
  email: { S: mockUser.email },
  phone: { S: mockUser.phone },
  primaryAffiliation: { S: mockUser.primaryAffiliation },
  affiliations: { SS: mockUser.affiliations },
  canvasRefreshToken: { S: mockUser.canvasRefreshToken },
  canvasOptIn: { BOOL: mockUser.canvasOptIn },
  onid: { S: mockUser.onid },
  lastLogin: { S: mockUser.lastLogin },
};

export const mockInsertReturn = mockUser;
export const mockUpdateCanvasDataReturn = mockUser;
export const mockFindReturn = mockUser;

export const User = {
  isStudent: () => {
    return mockUser.primaryAffiliation.toLowerCase() === 'student';
  },
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

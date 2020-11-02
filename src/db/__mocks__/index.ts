import { DynamoDB } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { lastLogin } from '../../utils/auth';

/* eslint-disable no-unused-vars */
export const mockQueryReturn = jest.fn();

export const query = jest.fn((params: DynamoDB.QueryInput) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockQueryReturn) resolve(mockQueryReturn());
      else reject(new Error('happy little accident'));
    });
  });
});

const mockScanReturn = {
  ScannedCount: 1,
  Count: 1,
  Items: [{ osuId: { N: '123456' } }],
};

export const scan = jest.fn((params: DynamoDB.ScanInput) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockScanReturn) resolve(mockScanReturn);
      else reject(new Error('happy little accident'));
    });
  });
});

const mockUpdateItemReturn = {
  thisIsnt: 'used, or necessary yet.',
};

export const updateItem = jest.fn((params: DynamoDB.UpdateItemInput) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockUpdateItemReturn) resolve(mockUpdateItemReturn);
      else reject(new Error('happy little accident'));
    });
  });
});

export const mockGetItemReturn = jest.fn(() => ({
  Item: {
    osuId: { N: '8675309' },
    firstName: { S: 'Bob' },
    lastName: { S: 'Ross' },
    email: { S: 'bob@bobross.com' },
    phone: { S: '5551212' },
    primaryAffiliation: { S: 'employee' },
    affiliations: { SS: ['employee'] },
    canvasRefreshToken: { S: '' },
    canvasOptIn: { BOOL: false },
    onid: { S: 'rossb' },
    lastLogin: { S: lastLogin() },
  },
}));

export const getItem = jest.fn((params: DynamoDB.GetItemInput) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockGetItemReturn) resolve(mockGetItemReturn());
      else reject(new Error('happy little accident'));
    });
  });
});

export const putItem = jest.fn((params: DynamoDB.PutItemInput) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockGetItemReturn) resolve(mockGetItemReturn());
      else reject(new Error('happy little accident'));
    });
  });
});

export const dynamoDb = {};
export default dynamoDb;

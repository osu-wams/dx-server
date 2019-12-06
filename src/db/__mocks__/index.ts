/* eslint-disable no-unused-vars */

const mockScanReturn = {
  ScannedCount: 1,
  Count: 1,
  Items: [{ osuId: { N: '123456' } }],
};

export const scan = jest.fn((params: AWS.DynamoDB.ScanInput) => {
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

export const updateItem = jest.fn((params: AWS.DynamoDB.UpdateItemInput) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockUpdateItemReturn) resolve(mockUpdateItemReturn);
      else reject(new Error('happy little accident'));
    });
  });
});

const mockGetItemReturn = {
  Item: {
    osuId: { N: '8675309' },
    firstName: { S: 'Bob' },
    lastName: { S: 'Ross' },
    email: { S: 'bob@bobross.com' },
    phone: { S: '5551212' },
    primaryAffiliation: { S: 'employee' },
    canvasRefreshToken: { S: '' },
    canvasOptIn: { BOOL: false },
  },
};

export const getItem = jest.fn((params: AWS.DynamoDB.GetItemInput) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockGetItemReturn) resolve(mockGetItemReturn);
      else reject(new Error('happy little accident'));
    });
  });
});

const mockPutItemReturn = {
  thisIsnt: 'used, or necessary yet.',
};

export const putItem = jest.fn((params: AWS.DynamoDB.PutItemInput) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockPutItemReturn) resolve(mockPutItemReturn);
      else reject(new Error('happy little accident'));
    });
  });
});

export const dynamoDb = {};
export default dynamoDb;

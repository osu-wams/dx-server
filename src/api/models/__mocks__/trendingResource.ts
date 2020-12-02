/* eslint-disable no-unused-vars */
export const mockGATrendingResource = {
  date: '2020-02-19',
  resourceId: 'test-resource-id',
  concatenatedTitle: 'Employee || Corvallis || Title',
  totalEvents: '42',
  uniqueEvents: '20',
};

export const mockTrendingResource = {
  date: '2020-02-19',
  resourceId: 'test-resource-id',
  affiliation: 'Employee',
  campus: 'Corvallis',
  title: 'Title',
  totalEvents: 42,
  uniqueEvents: 20,
};

export const mockDynamoDbTrendingResource = {
  Item: {
    date: { S: '2020-02-19' },
    resourceId: { S: 'test-resource-id' },
    affiliation: { S: 'Employee' },
    campus: { S: 'Corvallis' },
    title: { S: 'Title' },
    totalEvents: { N: '42' },
    uniqueEvents: { N: '20' },
  },
};

export const mockInsertReturn = mockTrendingResource;
export const mockUpdateCanvasDataReturn = mockTrendingResource;
export const mockFindReturn = mockTrendingResource;

export const TrendingResource = {
  findAll: jest.fn((osuId: number) => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        if (mockFindReturn) resolve([mockFindReturn]);
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
  scanAll: jest.fn(() => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        if (mockFindReturn) resolve([mockFindReturn]);
        else reject(new Error('happy little accident'));
      });
    });
  }),
};
export default TrendingResource;

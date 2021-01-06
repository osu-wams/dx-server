/* eslint-disable no-unused-vars */
export const mockFavoriteResource = {
  active: true,
  osuId: 123456,
  order: 0,
  created: '2020-02-19T21:09.123Z',
  resourceId: 'test-resource-id',
};

export const mockDynamoDbFavoriteResource = {
  active: { BOOL: true },
  created: { S: mockFavoriteResource.created },
  order: { N: `${mockFavoriteResource.order}` },
  osuId: { N: `${mockFavoriteResource.osuId}` },
  resourceId: { S: mockFavoriteResource.resourceId },
};

export const mockInsertReturn = mockFavoriteResource;
export const mockUpdateCanvasDataReturn = mockFavoriteResource;
export const mockFindReturn = mockFavoriteResource;

export const FavoriteResource = {
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
export default FavoriteResource;

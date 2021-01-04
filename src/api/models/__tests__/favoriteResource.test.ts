import { dynamoDbHandler } from '@src/mocks/handlers';
import { server } from '@src/mocks/server';
import {
  mockFavoriteResource,
  mockDynamoDbFavoriteResource,
} from '@src/api/models/__mocks__/favoriteResource';
import FavoriteResource from '../favoriteResource';

describe('FavoriteResource model', () => {
  it('has the DynamoDB table name defined', () => {
    expect(FavoriteResource.TABLE_NAME).toBe(`${FavoriteResource.TABLE_NAME}`);
  });

  describe('upsert', () => {
    it('returns 1 item', async () => {
      const result = await FavoriteResource.upsert(mockFavoriteResource);
      expect(mockFavoriteResource).toMatchObject(result);
    });
  });

  describe('with DynamoDb API calls', () => {
    describe('with two items', () => {
      const twoFavorites = [mockFavoriteResource, mockFavoriteResource];
      beforeEach(() => {
        const itemMap = {};
        itemMap[FavoriteResource.TABLE_NAME] = {
          Query: {
            Count: 2,
            ScannedCount: 2,
            Items: [mockDynamoDbFavoriteResource, mockDynamoDbFavoriteResource],
          },
        };
        dynamoDbHandler(server, itemMap);
      });
      it('findAll returns 2 items', async () => {
        const results = await FavoriteResource.findAll(mockFavoriteResource.osuId);
        expect(results.length).toStrictEqual(2);
        expect(twoFavorites).toMatchObject(results);
      });

      it('scanAll returns 2 items', async () => {
        const results = await FavoriteResource.scanAll();
        expect(results.length).toStrictEqual(2);
        expect(twoFavorites).toMatchObject(results);
      });
    });
  });
});

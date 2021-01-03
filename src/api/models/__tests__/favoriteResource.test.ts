import FavoriteResource from '../favoriteResource';
import { mockFavoriteResource } from '../__mocks__/favoriteResource';

describe('FavoriteResource model', () => {
  it('has the DynamoDB table name defined', () => {
    expect(FavoriteResource.TABLE_NAME).toBe(`${FavoriteResource.TABLE_NAME}`);
  });

  describe('with DynamoDb API calls', () => {
    describe('scanAll', () => {
      it('returns 1 item', async () => {
        const r = await FavoriteResource.scanAll();
        expect(r.length).toStrictEqual(1);
        expect(r[0]).toStrictEqual(mockFavoriteResource);
      });
    });
  });
});

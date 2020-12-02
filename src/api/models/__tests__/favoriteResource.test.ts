import AWS, { DynamoDB } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import FavoriteResource from '../favoriteResource';
import * as dynamoDb from '../../../db';

jest.mock('../../../db');
const mockDynamoDb = dynamoDb as jest.Mocked<any>;

const favoriteResource: FavoriteResource = {
  active: true,
  created: '2020-02-19T21:09.123Z',
  order: 0,
  osuId: 123456,
  resourceId: 'test-resource-id',
};

let dynamoDbFavoriteResource: AWS.DynamoDB.GetItemOutput;

describe('FavoriteResource model', () => {
  beforeEach(() => {
    dynamoDbFavoriteResource = {
      Item: {
        active: { BOOL: true },
        created: { S: '2020-02-19T21:09.123Z' },
        order: { N: '0' },
        osuId: { N: '123456' },
        resourceId: { S: 'test-resource-id' },
      },
    };
  });

  it('has the DynamoDB table name defined', () => {
    expect(FavoriteResource.TABLE_NAME).toBe(`${FavoriteResource.TABLE_NAME}`);
  });

  describe('constructs a new instance', () => {
    it('builds a FavoriteResource from data', () => {
      const fr = new FavoriteResource({ favoriteResource });
      expect(fr.osuId).toEqual(favoriteResource.osuId);
      expect(fr.active).toEqual(favoriteResource.active);
      expect(fr.created).toEqual(favoriteResource.created);
      expect(fr.resourceId).toEqual(favoriteResource.resourceId);
      expect(fr.order).toEqual(favoriteResource.order);
    });

    describe('with DynamoDb data', () => {
      it('builds a fully fleshed out FavoriteResource from DynamoDb data', () => {
        const item = dynamoDbFavoriteResource.Item;
        const fr = new FavoriteResource({ dynamoDbFavoriteResource: item });
        expect(fr.active).toEqual(item.active.BOOL);
        expect(fr.created).toEqual(item.created.S);
        expect(fr.order).toEqual(parseInt(item.order.N, 10));
        expect(fr.osuId).toEqual(parseInt(item.osuId.N, 10));
        expect(fr.resourceId).toEqual(item.resourceId.S);
      });

      it('builds a FavoriteResource missing some data', () => {
        dynamoDbFavoriteResource = {
          Item: {
            osuId: { N: '8675309' },
          },
        };
        const item = dynamoDbFavoriteResource.Item;
        const fr = new FavoriteResource({ dynamoDbFavoriteResource: item });
        expect(fr.osuId).toEqual(parseInt(item.osuId.N, 10));
        expect(fr.order).toEqual(0);
        expect(fr.active).toBeTruthy();
        expect(fr.created).toBeUndefined();
        expect(fr.resourceId).toBeUndefined();
      });
    });
  });

  describe('with DynamoDb API calls', () => {
    let fr: FavoriteResource;

    beforeEach(() => {
      fr = new FavoriteResource({ favoriteResource });
      mockDynamoDb.scan.mockImplementationOnce(() => ({
        ScannedCount: 1,
        Count: 1,
        Items: [dynamoDbFavoriteResource.Item],
      }));
    });
    describe('scanAll', () => {
      it('returns 1 item', async () => {
        const r = await FavoriteResource.scanAll();
        expect(r.length).toStrictEqual(1);
        expect(r[0]).toStrictEqual(fr);
      });
      it('returns an empty array on error', async () => {
        mockDynamoDb.scan.mockImplementationOnce(() =>
          Promise.reject(new Error('happy little accident')),
        );
        try {
          await FavoriteResource.scanAll();
        } catch (err) {
          expect(err.message).toBe('happy little accident');
        }
      });
    });
  });
});

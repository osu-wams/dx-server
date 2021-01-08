import { fromGoogle, fromApi, fromDynamoDb } from '@src/mocks/google/trendingResources';
import { dynamoDbHandler } from '@src/mocks/handlers';
import { server } from '@src/mocks/server';
import {
  TrendingResource,
  GoogleTrendingResource,
  TABLE_NAME,
  find,
  upsert,
  findAll,
  scanAll,
} from '../trendingResource';

describe('TrendingResource model', () => {
  it('has the DynamoDB table name defined', async () => {
    expect(TABLE_NAME).toBe(`${TABLE_NAME}`);
  });

  describe('with DynamoDb API calls', () => {
    const g: GoogleTrendingResource = fromGoogle('2020-01-01')[0];
    const a: TrendingResource = fromApi(g.date, '7day').reverse()[0];

    describe('find', () => {
      it('returns 1 item', async () => {
        const result = await find(a.resourceId, a.date);
        expect(a).toMatchObject(result);
      });
    });

    describe('upsert', () => {
      it('returns 1 item', async () => {
        const result = await upsert(g);
        expect(a).toMatchObject(result);
      });
    });

    describe('with two items', () => {
      beforeEach(() => {
        const itemMap = {};
        itemMap[TABLE_NAME] = {
          Query: {
            Count: 2,
            ScannedCount: 2,
            Items: fromDynamoDb('2020-01-01'),
          },
        };
        dynamoDbHandler(server, itemMap);
      });
      it('findAll returns 2 items', async () => {
        const results = await findAll('2020-01-01');
        expect(results.length).toStrictEqual(2);
        expect(fromApi('2020-01-01').reverse()).toMatchObject(results);
      });

      it('scanAll returns 2 items', async () => {
        const results = await scanAll();
        expect(results.length).toStrictEqual(2);
        expect(fromApi('2020-01-01').reverse()).toMatchObject(results);
      });
    });
  });
});

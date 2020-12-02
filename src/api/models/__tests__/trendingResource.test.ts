import AWS, { DynamoDB } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import TrendingResource from '../trendingResource';
import * as dynamoDb from '../../../db';
import {
  mockTrendingResource,
  mockGATrendingResource,
  mockDynamoDbTrendingResource,
} from '../__mocks__/trendingResource';

jest.mock('../../../db');
const mockDynamoDb = dynamoDb as jest.Mocked<any>;

let dynamoDbTrendingResource: AWS.DynamoDB.GetItemOutput;

describe('TrendingResource model', () => {
  beforeEach(() => {
    dynamoDbTrendingResource = { ...mockDynamoDbTrendingResource };
  });

  it('has the DynamoDB table name defined', () => {
    expect(TrendingResource.TABLE_NAME).toBe(`${TrendingResource.TABLE_NAME}`);
  });

  describe('constructs a new instance', () => {
    it('builds a TrendingResource from data', () => {
      const r = new TrendingResource({ trendingResource: mockGATrendingResource });
      expect(r.affiliation).toEqual(mockTrendingResource.affiliation);
      expect(r.campus).toEqual(mockTrendingResource.campus);
      expect(r.date).toEqual(mockTrendingResource.date);
      expect(r.period).toBeUndefined();
      expect(r.resourceId).toEqual(mockTrendingResource.resourceId);
      expect(r.title).toEqual(mockTrendingResource.title);
      expect(r.totalEvents).toEqual(mockTrendingResource.totalEvents);
      expect(r.uniqueEvents).toEqual(mockTrendingResource.uniqueEvents);
    });

    describe('with DynamoDb data', () => {
      it('builds a fully fleshed out TrendingResource from DynamoDb data', () => {
        const item = dynamoDbTrendingResource.Item;
        const r = new TrendingResource({ dynamoDbTrendingResource: item });
        expect(r.affiliation).toEqual(item.affiliation.S);
        expect(r.campus).toEqual(item.campus.S);
        expect(r.date).toEqual(item.date.S);
        expect(r.period).toBeUndefined();
        expect(r.resourceId).toEqual(item.resourceId.S);
        expect(r.title).toEqual(item.title.S);
        expect(r.totalEvents).toEqual(parseInt(item.totalEvents.N, 10));
        expect(r.uniqueEvents).toEqual(parseInt(item.uniqueEvents.N, 10));
      });
    });
  });

  describe('with DynamoDb API calls', () => {
    let r: TrendingResource;

    beforeEach(() => {
      r = new TrendingResource({ trendingResource: mockGATrendingResource });
      mockDynamoDb.scan.mockImplementationOnce(() => ({
        ScannedCount: 1,
        Count: 1,
        Items: [dynamoDbTrendingResource.Item],
      }));
    });
    describe('scanAll', () => {
      it('returns 1 item', async () => {
        const results = await TrendingResource.scanAll();
        expect(results.length).toStrictEqual(1);
        expect(results[0]).toStrictEqual(r);
      });
      it('returns an empty array on error', async () => {
        mockDynamoDb.scan.mockImplementationOnce(() =>
          Promise.reject(new Error('happy little accident')),
        );
        try {
          await TrendingResource.scanAll();
        } catch (err) {
          expect(err.message).toBe('happy little accident');
        }
      });
    });
  });
});

import { DynamoDB } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { DYNAMODB_TABLE_PREFIX } from '../../constants';
import logger from '../../logger';
import { asyncTimedFunction } from '../../tracer';
import { query, putItem, scan } from '../../db';
import { getCache, setCache } from '../modules/cache';

export interface DynamoDBTrendingResourceItem extends DynamoDB.PutItemInputAttributeMap {
  date: { S: string };
  resourceId: { S: string };
  affiliation: { S: string };
  campus: { S: string };
  title: { S: string };
  totalEvents: { N: string };
  uniqueEvents: { N: string };
}

interface TrendingResourceParams {
  trendingResource?: {
    resourceId: string;
    concatenatedTitle: string;
    totalEvents: string;
    uniqueEvents: string;
    date: string;
  };
  dynamoDbTrendingResource?: DynamoDB.AttributeMap;
}

class TrendingResource {
  date: string;

  resourceId: string;

  affiliation: string;

  campus: string;

  title: string;

  totalEvents: number;

  uniqueEvents: number;

  period?: string;

  static TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-TrendingResources`;

  constructor(p: TrendingResourceParams) {
    if (p.trendingResource) {
      const { date, resourceId, concatenatedTitle, totalEvents, uniqueEvents } = p.trendingResource;
      this.resourceId = resourceId?.trim() ?? '<missing data>';
      const [affiliation, campus, title] = concatenatedTitle.split(' || ');
      this.affiliation = affiliation?.trim() ?? '<missing data>';
      this.campus = campus?.trim() ?? '<missing data>';
      this.title = title?.trim() ?? '<missing data>';
      this.totalEvents = parseInt(totalEvents, 10);
      this.uniqueEvents = parseInt(uniqueEvents, 10);
      this.date = date;
    }

    if (p.dynamoDbTrendingResource) {
      const {
        resourceId,
        date,
        affiliation,
        campus,
        title,
        totalEvents,
        uniqueEvents,
      } = p.dynamoDbTrendingResource;
      this.resourceId = resourceId.S;
      this.date = date.S;
      this.affiliation = affiliation.S;
      this.campus = campus.S;
      this.title = title.S;
      this.totalEvents = parseInt(totalEvents.N, 10);
      this.uniqueEvents = parseInt(uniqueEvents.N, 10);
    }
  }

  static upsert = async (props: TrendingResource): Promise<TrendingResource> => {
    // ! DynamoDb only supports 'ALL_OLD' or 'NONE' for return values from the
    // ! putItem call, which means the only way to get values from ddb would be to
    // ! getItem with the key after having put the item successfully. The DX use
    // ! doesn't really seem like it needs to fetch the record after having created it
    // ! the first time.
    try {
      const params: DynamoDB.PutItemInput = {
        TableName: TrendingResource.TABLE_NAME,
        Item: TrendingResource.asDynamoDbItem(props),
        ReturnValues: 'NONE',
      };

      const result = await asyncTimedFunction(putItem, 'TrendingResource:putItem', [params]);
      logger().silly('TrendingResource.upsert succeeded:', result);
      return TrendingResource.find(props.resourceId, props.date);
    } catch (err) {
      logger().error(`FavoriteResource.upsert failed:`, props, err);
      throw err;
    }
  };

  static findAll = async (date: string): Promise<TrendingResource[] | null> => {
    try {
      const params: DynamoDB.QueryInput = {
        TableName: TrendingResource.TABLE_NAME,
        KeyConditionExpression: '#dateAttribute = :dateStart',
        ExpressionAttributeNames: {
          '#dateAttribute': 'date',
        },
        ExpressionAttributeValues: {
          ':dateStart': { S: `${date}` },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      const results: DynamoDB.QueryOutput = await asyncTimedFunction(
        query,
        'TrendingResource:query',
        [params],
      );
      return results.Items.map((i) => new TrendingResource({ dynamoDbTrendingResource: i }));
    } catch (err) {
      logger().error(`TrendingResource.findAll(${date}) failed:`, err);
      throw err;
    }
  };

  static find = async (resourceId: string, date: string): Promise<TrendingResource | null> => {
    try {
      const params: DynamoDB.QueryInput = {
        TableName: TrendingResource.TABLE_NAME,
        KeyConditionExpression:
          '#dateAttribute = :dateValue AND #resourceAttribute = :resourceValue',
        ExpressionAttributeNames: {
          '#dateAttribute': 'date',
          '#resourceAttribute': 'resourceId',
        },
        ExpressionAttributeValues: {
          ':dateValue': { S: `${date}` },
          ':resourceValue': { S: `${resourceId}` },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      const results: DynamoDB.QueryOutput = await asyncTimedFunction(
        query,
        'TrendingResource:query',
        [params],
      );
      return new TrendingResource({ dynamoDbTrendingResource: results.Items[0] });
    } catch (err) {
      logger().error(`TrendingResource.find(${resourceId}, ${date}) failed:`, err);
      throw err;
    }
  };

  static scanAll = async (): Promise<TrendingResource[]> => {
    const cached = await getCache(TrendingResource.TABLE_NAME);
    if (cached) {
      return JSON.parse(cached);
    }

    const found = [];
    let lastKey;
    do {
      // eslint-disable-next-line
      const results = await scan({
        TableName: TrendingResource.TABLE_NAME,
        ExclusiveStartKey: lastKey,
      });
      found.push(...results.Items);
      logger().info(
        `${TrendingResource.TABLE_NAME} scan returned ${results.Items.length}, total: ${found.length}`,
      );
      lastKey = results.LastEvaluatedKey;
    } while (lastKey);

    const resources = found.map((i) => new TrendingResource({ dynamoDbTrendingResource: i }));
    setCache(TrendingResource.TABLE_NAME, JSON.stringify(resources), {
      mode: 'EX',
      duration: 24 * 60 * 60,
      flag: 'NX',
    });
    return resources;
  };

  /**
   * Translate the TrendingResource properties into the properly shaped data as an Item for
   * Dynamodb.
   * @param props - the properties to translate to a dynamodb item
   * @returns DynamoDbTrendingResourceItem - the Item for use in Dynamodb
   */
  static asDynamoDbItem = (props: TrendingResource): DynamoDBTrendingResourceItem => {
    return {
      resourceId: { S: props.resourceId },
      date: { S: props.date },
      affiliation: { S: props.affiliation },
      campus: { S: props.campus },
      title: { S: props.title },
      totalEvents: { N: `${props.totalEvents}` },
      uniqueEvents: { N: `${props.uniqueEvents}` },
    };
  };
}

export default TrendingResource;

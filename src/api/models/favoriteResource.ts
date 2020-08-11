import config from 'config';
import logger from '../../logger';
import { asyncTimedFunction } from '../../tracer';
import { putItem, query } from '../../db';
import { getCache, setCache } from '../modules/cache';

const tablePrefix = config.get('aws.dynamodb.tablePrefix');
const cacheKey = (osuId: number) => `favorites:${osuId}`;

interface FavoriteResourceParams {
  favoriteResource?: FavoriteResource;
  dynamoDbFavoriteResource?: AWS.DynamoDB.AttributeMap;
}

export interface DynamoDBFavoriteResourceItem extends AWS.DynamoDB.PutItemInputAttributeMap {
  active: { BOOL: boolean };
  created: { S: string };
  order: { N: string };
  osuId: { N: string };
  resourceId: { S: string };
}

class FavoriteResource {
  active: boolean = true;

  created: string;

  order: number = 0;

  osuId: number;

  resourceId: string;

  static TABLE_NAME: string = `${tablePrefix}-FavoriteResources`;

  /**
   * Initializes a new instance of the FavoriteResource with the supplied data.
   * @param p [FavoriteResourceParams] - optional params to intitialize the favorite resource with depending
   *        on the source of data which is passed
   */
  constructor(p: FavoriteResourceParams) {
    if (p.favoriteResource) {
      const { osuId, resourceId, created, active, order } = p.favoriteResource;
      this.active = active;
      this.created = created;
      this.order = order;
      this.osuId = osuId;
      this.resourceId = resourceId;
    }

    if (p.dynamoDbFavoriteResource) {
      const { osuId, resourceId, created, active, order } = p.dynamoDbFavoriteResource;
      this.active = active.BOOL;
      this.created = created.S;
      this.order = parseInt(order.N, 10);
      this.osuId = parseInt(osuId.N, 10);
      this.resourceId = resourceId.S;
    }
  }

  static upsert = async (props: FavoriteResource): Promise<FavoriteResource> => {
    // ! DynamoDb only supports 'ALL_OLD' or 'NONE' for return values from the
    // ! putItem call, which means the only way to get values from ddb would be to
    // ! getItem with the key after having put the item successfully. The DX use
    // ! doesn't really seem like it needs to fetch the user after having created it
    // ! the first time.
    try {
      const params: AWS.DynamoDB.PutItemInput = {
        TableName: FavoriteResource.TABLE_NAME,
        Item: FavoriteResource.asDynamoDbItem(props),
        ReturnValues: 'NONE',
      };

      const result = await asyncTimedFunction(putItem, 'FavoriteResource:putItem', [params]);
      logger().silly('FavoriteResource.upsert succeeded:', result);
      const all = await FavoriteResource.findAll(props.osuId, false);
      await setCache(cacheKey(props.osuId), JSON.stringify(all));
      return props;
    } catch (err) {
      logger().error(`FavoriteResource.upsert failed:`, props, err);
      throw err;
    }
  };

  static findAll = async (
    osuId: number,
    checkCache: boolean = true,
  ): Promise<FavoriteResource[] | null> => {
    try {
      if (checkCache) {
        // get from cache, if it exists return otherwise query dynamo
        const cached = await getCache(cacheKey(osuId));
        if (cached) return JSON.parse(cached);
      }

      const params: AWS.DynamoDB.QueryInput = {
        TableName: FavoriteResource.TABLE_NAME,
        KeyConditionExpression: 'osuId = :value',
        ExpressionAttributeValues: {
          ':value': { N: `${osuId}` },
        },
        Select: 'ALL_ATTRIBUTES',
      };
      const results: AWS.DynamoDB.QueryOutput = await asyncTimedFunction(
        query,
        'FavoriteResource:query',
        [params],
      );
      return results.Items?.map((i) => new FavoriteResource({ dynamoDbFavoriteResource: i }));
    } catch (err) {
      logger().error(`FavoriteResource.findAll(${osuId}) failed:`, err);
      throw err;
    }
  };

  /**
   * Translate the FavoriteResource properties into the properly shaped data as an Item for
   * Dynamodb.
   * @param props - the properties to translate to a dynamodb item
   * @returns DynamoDbFavoriteResourceItem - the Item for use in Dynamodb
   */
  static asDynamoDbItem = (props: FavoriteResource): DynamoDBFavoriteResourceItem => {
    const { osuId, resourceId, created, active, order } = props;
    const Item: DynamoDBFavoriteResourceItem = {
      active: { BOOL: active },
      created: { S: created },
      order: { N: `${order}` },
      osuId: { N: `${osuId}` },
      resourceId: { S: resourceId },
    };
    return Item;
  };
}

export default FavoriteResource;

import DynamoDB from 'aws-sdk/clients/dynamodb'; // eslint-disable-line no-unused-vars
import { Table, Entity } from 'dynamodb-toolbox';
import { DYNAMODB_TABLE_PREFIX } from '../../constants';
import logger from '../../logger';
import { DocumentClient } from '../../db';
import { getCache, setCache } from '../modules/cache';

const TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-FavoriteResources`;

interface FavoriteResourceProps {
  active: boolean;
  created: string;
  order: number;
  osuId: number;
  resourceId: string;
}

interface FavoriteResources {
  // eslint-disable-next-line no-use-before-define
  Items: FavoriteResource[];
  next?: Function;
}

const table = new Table({
  name: TABLE_NAME,
  partitionKey: 'osuId',
  sortKey: 'resourceId',
  DocumentClient,
});

const FavoriteResourceEntity = new Entity({
  name: 'FavoriteResource',
  attributes: {
    osuId: { partitionKey: true, type: 'number' },
    resourceId: { sortKey: true, type: 'string' },
    order: { type: 'number', coerce: true },
    active: { type: 'boolean', coerce: true },
    // created: { type: 'string' } // Already set as an alias for _ct
  },
  table,
  autoExecute: true,
  autoParse: true,
});

export const TableDefinition: DynamoDB.CreateTableInput = {
  AttributeDefinitions: [
    { AttributeName: 'osuId', AttributeType: 'N' },
    { AttributeName: 'resourceId', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'osuId', KeyType: 'HASH' },
    { AttributeName: 'resourceId', KeyType: 'RANGE' },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
  TableName: TABLE_NAME,
  StreamSpecification: {
    StreamEnabled: false,
  },
};

class FavoriteResource {
  active: boolean = true;

  created: string;

  order: number = 0;

  osuId: number;

  resourceId: string;

  static TABLE_NAME: string = TABLE_NAME;

  static upsert = async (props: FavoriteResourceProps): Promise<FavoriteResource> => {
    try {
      await FavoriteResourceEntity.put(props);
      logger().silly('FavoriteResource.upsert succeeded:', props);
      return props;
    } catch (err) {
      logger().error(`FavoriteResource.upsert failed:`, props, err);
      throw err;
    }
  };

  static findAll = async (osuId: number): Promise<FavoriteResource[] | null> => {
    try {
      const results: FavoriteResources = await FavoriteResourceEntity.query(osuId);
      return results.Items;
    } catch (err) {
      logger().error(`FavoriteResource.findAll(${osuId}) failed:`, err);
      throw err;
    }
  };

  static scanAll = async (): Promise<FavoriteResource[]> => {
    const cached = await getCache(FavoriteResource.TABLE_NAME);
    if (cached) {
      return JSON.parse(cached);
    }

    const found: FavoriteResource[] = [];
    let results: FavoriteResources = await FavoriteResourceEntity.scan();
    found.push(...results.Items);
    logger().info(
      `${FavoriteResource.TABLE_NAME} scan returned ${results.Items.length}, total: ${found.length}`,
    );

    while (results.next) {
      // eslint-disable-next-line no-await-in-loop
      results = await results.next();
      found.push(...results.Items);
      logger().info(
        `${FavoriteResource.TABLE_NAME} scan returned ${results.Items.length}, total: ${found.length}`,
      );
    }

    await setCache(FavoriteResource.TABLE_NAME, JSON.stringify(found), {
      mode: 'EX',
      duration: 24 * 60 * 60,
      flag: 'NX',
    });

    return found;
  };
}

export default FavoriteResource;

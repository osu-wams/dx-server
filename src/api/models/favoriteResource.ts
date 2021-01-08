import DynamoDB from 'aws-sdk/clients/dynamodb'; // eslint-disable-line no-unused-vars
import { Table, Entity } from 'dynamodb-toolbox';
import { DYNAMODB_TABLE_PREFIX } from '../../constants';
import logger from '../../logger';
import { DocumentClient } from '../../db';
import { getCache, setCache } from '../modules/cache';

export interface FavoriteResource {
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

export const TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-FavoriteResources`;

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

const table = (client?: typeof DocumentClient) =>
  new Table({
    name: TABLE_NAME,
    partitionKey: 'osuId',
    sortKey: 'resourceId',
    DocumentClient: client ?? DocumentClient,
  });

const FavoriteResourceEntity = (client?: typeof DocumentClient) =>
  new Entity({
    name: 'FavoriteResource',
    attributes: {
      osuId: { partitionKey: true, type: 'number' },
      resourceId: { sortKey: true, type: 'string' },
      order: { type: 'number', coerce: true, default: 0 },
      active: { type: 'boolean', coerce: true, default: true },
      // created: { type: 'string' } // Already set as an alias for _ct
    },
    table: table(client),
    autoExecute: true,
    autoParse: true,
  });

export const upsert = async (
  props: FavoriteResource,
  client?: typeof DocumentClient,
): Promise<FavoriteResource> => {
  try {
    await FavoriteResourceEntity(client).put(props);
    logger().silly('FavoriteResource.upsert succeeded:', props);
    return props;
  } catch (err) {
    logger().error(`FavoriteResource.upsert failed:`, props, err);
    throw err;
  }
};

export const findAll = async (
  osuId: number,
  client?: typeof DocumentClient,
): Promise<FavoriteResource[] | null> => {
  try {
    const results: FavoriteResources = await FavoriteResourceEntity(client).query(osuId);
    return results.Items;
  } catch (err) {
    logger().error(`FavoriteResource.findAll(${osuId}) failed:`, err);
    throw err;
  }
};

export const scanAll = async (client?: typeof DocumentClient): Promise<FavoriteResource[]> => {
  const cached = await getCache(TABLE_NAME);
  if (cached) {
    return JSON.parse(cached);
  }

  const found: FavoriteResource[] = [];
  let results: FavoriteResources = await FavoriteResourceEntity(client).scan();
  found.push(...results.Items);
  logger().info(`${TABLE_NAME} scan returned ${results.Items.length}, total: ${found.length}`);

  while (results.next) {
    // eslint-disable-next-line no-await-in-loop
    results = await results.next();
    found.push(...results.Items);
    logger().info(`${TABLE_NAME} scan returned ${results.Items.length}, total: ${found.length}`);
  }

  await setCache(TABLE_NAME, JSON.stringify(found), {
    mode: 'EX',
    duration: 24 * 60 * 60,
    flag: 'NX',
  });

  return found;
};

export default {
  findAll,
  scanAll,
  upsert,
  TABLE_NAME,
};

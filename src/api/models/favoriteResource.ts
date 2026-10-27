import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  Table,
  Entity,
  item,
  string,
  number,
  boolean,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from 'dynamodb-toolbox';
import { DYNAMODB_TABLE_PREFIX } from '../../constants';
import logger from '../../logger';
import { DocumentClient } from '../../db';
import { normalizeItem, toBoolean, toNumber } from '../../db/format';
import { getCache, setCache } from '../modules/cache';

export interface FavoriteResource {
  active: boolean;
  created: string;
  order: number;
  osuId: number;
  resourceId: string;
}

type Client = DynamoDBDocumentClient;

export const TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-FavoriteResources`;

export const TableDefinition: CreateTableCommandInput = {
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

const table = (client?: Client) =>
  new Table({
    name: TABLE_NAME,
    partitionKey: { name: 'osuId', type: 'number' },
    sortKey: { name: 'resourceId', type: 'string' },
    documentClient: client ?? DocumentClient,
  });

const favoriteResourceSchema = item({
  osuId: number().key(),
  resourceId: string().key(),
  order: number().optional().putDefault(0),
  active: boolean().optional().putDefault(true),
  // created: the `created` timestamp attribute is managed by the entity and saved as `_ct`
});

const FavoriteResourceEntity = (client?: Client) =>
  new Entity({
    name: 'FavoriteResource',
    table: table(client),
    schema: favoriteResourceSchema,
    timestamps: {
      created: { name: 'created' },
      modified: { name: 'modified' },
    },
  });

const toItem = (props: FavoriteResource) => ({
  osuId: toNumber(props.osuId),
  resourceId: props.resourceId,
  order: toNumber(props.order),
  active: toBoolean(props.active),
});

/**
 * Translate a raw DynamoDB item into a FavoriteResource, the `created` value is the
 * dynamodb-toolbox created timestamp (`_ct`) unless a `created` attribute exists.
 */
const fromItem = (raw: Record<string, any>): FavoriteResource => {
  const created = raw.created ?? raw._ct;
  return { ...normalizeItem<FavoriteResource>(raw), created };
};

export const upsert = async (props: FavoriteResource, client?: Client): Promise<FavoriteResource> => {
  try {
    await FavoriteResourceEntity(client)
      .build(PutItemCommand)
      .item(toItem(props))
      .send();
    logger().silly('FavoriteResource.upsert succeeded:', props);
    return props;
  } catch (err) {
    logger().error(`FavoriteResource.upsert failed:`, props, err);
    throw err;
  }
};

export const findAll = async (osuId: number, client?: Client): Promise<FavoriteResource[] | null> => {
  try {
    const { Items = [] } = await table(client)
      .build(QueryCommand)
      .query({ partition: osuId })
      .send();
    return Items.map(fromItem);
  } catch (err) {
    logger().error(`FavoriteResource.findAll(${osuId}) failed:`, err);
    throw err;
  }
};

export const scanAll = async (client?: Client): Promise<FavoriteResource[]> => {
  const cached = await getCache(TABLE_NAME);
  if (cached) {
    return JSON.parse(cached);
  }

  const found: FavoriteResource[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const { Items = [], LastEvaluatedKey } = await table(client)
      .build(ScanCommand)
      .options(exclusiveStartKey ? { exclusiveStartKey } : {})
      .send();
    const resources = Items.map(fromItem);
    found.push(...resources);
    logger().info(`${TABLE_NAME} scan returned ${resources.length}, total: ${found.length}`);
    exclusiveStartKey = LastEvaluatedKey;
  } while (exclusiveStartKey);

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

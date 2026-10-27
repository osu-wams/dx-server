import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  Table,
  Entity,
  item,
  string,
  number,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from 'dynamodb-toolbox';
import { DYNAMODB_TABLE_PREFIX } from '../../constants';
import logger from '../../logger';
import { DocumentClient } from '../../db';
import { normalizeItem, toNumber } from '../../db/format';
import { getCache, setCache } from '../modules/cache';

export interface GoogleTrendingResource {
  resourceId: string;
  concatenatedTitle: string;
  totalEvents: string;
  uniqueEvents: string;
  date: string;
  period?: string;
}

export interface TrendingResource {
  date: string;
  resourceId: string;
  affiliation: string;
  campus: string;
  title: string;
  totalEvents: number;
  uniqueEvents: number;
  period?: string;
}

type Client = DynamoDBDocumentClient;

export const TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-TrendingResources`;

export const TableDefinition: CreateTableCommandInput = {
  AttributeDefinitions: [
    { AttributeName: 'date', AttributeType: 'S' },
    { AttributeName: 'resourceId', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'date', KeyType: 'HASH' },
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

const getTitlePart = (title: string, index: number): string => {
  const parts = (title ?? '').split(' || ');
  return parts[index]?.trim() ?? '<missing data>';
};

const table = (client?: Client) =>
  new Table({
    name: TABLE_NAME,
    partitionKey: { name: 'date', type: 'string' },
    sortKey: { name: 'resourceId', type: 'string' },
    documentClient: client ?? DocumentClient,
  });

const trendingResourceSchema = item({
  date: string().key(),
  resourceId: string().key(),
  affiliation: string().optional(),
  campus: string().optional(),
  title: string().optional(),
  totalEvents: number().optional(),
  uniqueEvents: number().optional(),
  period: string().optional(),
});

const TrendingResourceEntity = (client?: Client) =>
  new Entity({
    name: 'TrendingResource',
    table: table(client),
    schema: trendingResourceSchema,
  });

/**
 * Translate the Google Analytics data into the item shape persisted in DynamoDB, the
 * affiliation, campus and title are derived from the concatenated title.
 */
const toItem = (props: GoogleTrendingResource) => ({
  date: props.date,
  resourceId: props.resourceId?.trim() ?? '<missing data>',
  affiliation: getTitlePart(props.concatenatedTitle, 0),
  campus: getTitlePart(props.concatenatedTitle, 1),
  title: getTitlePart(props.concatenatedTitle, 2),
  totalEvents: toNumber(props.totalEvents),
  uniqueEvents: toNumber(props.uniqueEvents),
  period: props.period,
});

export const findAll = async (date: string, client?: Client): Promise<TrendingResource[] | null> => {
  try {
    const { Items = [] } = await table(client)
      .build(QueryCommand)
      .query({ partition: date })
      .send();
    return Items.map((i) => normalizeItem<TrendingResource>(i));
  } catch (err) {
    logger().error(`TrendingResource.findAll(${date}) failed:`, err);
    throw err;
  }
};

export const find = async (
  resourceId: string,
  date: string,
  client?: Client,
): Promise<TrendingResource | null> => {
  try {
    const { Items = [] } = await table(client)
      .build(QueryCommand)
      .query({ partition: date, range: { eq: resourceId } })
      .send();
    return Items[0] ? normalizeItem<TrendingResource>(Items[0]) : undefined;
  } catch (err) {
    logger().error(`TrendingResource.find(${resourceId}, ${date}) failed:`, err);
    throw err;
  }
};

export const upsert = async (
  props: GoogleTrendingResource,
  client?: Client,
): Promise<TrendingResource> => {
  try {
    const result = await TrendingResourceEntity(client)
      .build(PutItemCommand)
      .item(toItem(props))
      .send();
    logger().info('TrendingResource.upsert succeeded:', result);
    return find(props.resourceId, props.date, client);
  } catch (err) {
    logger().error(`TrendingResource.upsert failed:`, props, err);
    throw err;
  }
};

export const scanAll = async (client?: Client): Promise<TrendingResource[]> => {
  const cached = await getCache(TABLE_NAME);
  if (cached) {
    return JSON.parse(cached);
  }

  const found: TrendingResource[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const { Items = [], LastEvaluatedKey } = await table(client)
      .build(ScanCommand)
      .options(exclusiveStartKey ? { exclusiveStartKey } : {})
      .send();
    const resources = Items.map((i) => normalizeItem<TrendingResource>(i));
    found.push(...resources);
    logger().info(`${TABLE_NAME} scan returned ${resources.length}, total: ${found.length}`);
    exclusiveStartKey = LastEvaluatedKey;
  } while (exclusiveStartKey);

  setCache(TABLE_NAME, JSON.stringify(found), {
    mode: 'EX',
    duration: 24 * 60 * 60,
    flag: 'NX',
  });

  return found;
};

export default {
  upsert,
  find,
  findAll,
  scanAll,
  TABLE_NAME,
};

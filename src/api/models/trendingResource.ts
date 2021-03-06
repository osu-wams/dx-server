import DynamoDB from 'aws-sdk/clients/dynamodb'; // eslint-disable-line no-unused-vars
import { Table, Entity } from 'dynamodb-toolbox';
import { DYNAMODB_TABLE_PREFIX } from '../../constants';
import logger from '../../logger';
import { DocumentClient } from '../../db';
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

interface TrendingResources {
  Items: TrendingResource[];
  next?: Function;
}

export const TABLE_NAME: string = `${DYNAMODB_TABLE_PREFIX}-TrendingResources`;

export const TableDefinition: DynamoDB.CreateTableInput = {
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
  const parts = title.split(' || ');
  return parts[index]?.trim() ?? '<missing data>';
};

const table = (client?: typeof DocumentClient) =>
  new Table({
    name: TABLE_NAME,
    partitionKey: 'date',
    sortKey: 'resourceId',
    DocumentClient: client ?? DocumentClient,
  });

const TrendingResourceEntity = (client?: typeof DocumentClient) =>
  new Entity({
    name: 'TrendingResource',
    attributes: {
      date: { partitionKey: true, type: 'string' },
      resourceId: {
        sortKey: true,
        type: 'string',
        default: (data) => data.resourceId?.trim() ?? '<missing data>',
      },
      affiliation: { type: 'string', default: (data) => getTitlePart(data.concatenatedTitle, 0) },
      campus: { type: 'string', default: (data) => getTitlePart(data.concatenatedTitle, 1) },
      title: { type: 'string', default: (data) => getTitlePart(data.concatenatedTitle, 2) },
      totalEvents: { type: 'number', coerce: true },
      uniqueEvents: { type: 'number', coerce: true },
      period: { type: 'string' },
      concatenatedTitle: { type: 'string', save: false },
    },
    table: table(client),
    autoExecute: true,
    autoParse: true,
  });

export const findAll = async (
  date: string,
  client?: typeof DocumentClient,
): Promise<TrendingResource[] | null> => {
  try {
    const results: TrendingResources = await TrendingResourceEntity(client).query(date);
    return results.Items;
  } catch (err) {
    logger().error(`TrendingResource.findAll(${date}) failed:`, err);
    throw err;
  }
};

export const find = async (
  resourceId: string,
  date: string,
  client?: typeof DocumentClient,
): Promise<TrendingResource | null> => {
  try {
    const result: TrendingResources = await TrendingResourceEntity(client).query(date, {
      eq: resourceId,
    });
    return result.Items[0];
  } catch (err) {
    logger().error(`TrendingResource.find(${resourceId}, ${date}) failed:`, err);
    throw err;
  }
};

export const upsert = async (
  props: GoogleTrendingResource,
  client?: typeof DocumentClient,
): Promise<TrendingResource> => {
  try {
    const result: TrendingResources = await TrendingResourceEntity(client).put(props);
    logger().info('TrendingResource.upsert succeeded:', result);
    return find(props.resourceId, props.date);
  } catch (err) {
    logger().error(`TrendingResource.upsert failed:`, props, err);
    throw err;
  }
};

export const scanAll = async (client?: typeof DocumentClient): Promise<TrendingResource[]> => {
  const cached = await getCache(TABLE_NAME);
  if (cached) {
    return JSON.parse(cached);
  }

  const found = [];
  let results: TrendingResources = await TrendingResourceEntity(client).scan();
  found.push(...results.Items);
  logger().info(`${TABLE_NAME} scan returned ${results.Items.length}, total: ${found.length}`);
  while (results.next) {
    // eslint-disable-next-line no-await-in-loop
    results = await results.next();
    found.push(...results.Items);
    logger().info(`${TABLE_NAME} scan returned ${results.Items.length}, total: ${found.length}`);
  }

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

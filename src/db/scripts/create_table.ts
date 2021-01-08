/* eslint-disable no-console */
import { DynamoDB, AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { DYNAMODB } from '../../constants';
import dynamoDb from '../index';
import {
  TABLE_NAME as USER_TABLE_NAME,
  TableDefinition as UserTableDefinition,
} from '../../api/models/user';
import {
  TABLE_NAME as FAVORITE_TABLE_NAME,
  TableDefinition as FavoriteTableDefinition,
} from '../../api/models/favoriteResource';
import {
  TABLE_NAME as TRENDING_TABLE_NAME,
  TableDefinition as TrendingTableDefinition,
} from '../../api/models/trendingResource';

const createTable = (table?: string): void => {
  if (!table) {
    console.error('Exiting. Must provide table name. (user, favorite, trending)');
    process.exit();
  }
  let TableDefinition;
  let TABLE_NAME;

  switch (table.toLowerCase()) {
    case 'user':
      TableDefinition = UserTableDefinition;
      TABLE_NAME = USER_TABLE_NAME;
      break;
    case 'favorite':
      TableDefinition = FavoriteTableDefinition;
      TABLE_NAME = FAVORITE_TABLE_NAME;
      break;
    case 'trending':
      TableDefinition = TrendingTableDefinition;
      TABLE_NAME = TRENDING_TABLE_NAME;
      break;

    default:
      console.error('Exiting. Must provide table name. (user, favorite, trending)');
      process.exit();
      break;
  }

  console.info('Accessing dynamoDb:', DYNAMODB);

  dynamoDb.createTable(TableDefinition, (err: AWSError, data: DynamoDB.CreateTableOutput) => {
    if (err) {
      console.error(`Error creating ${TABLE_NAME} table.`, err);
    } else {
      console.info(`Created ${TABLE_NAME} table.`, data);
    }
    process.exit();
  });
};

createTable(process.argv[2]);

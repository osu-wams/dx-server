/* eslint-disable no-console */

import config from 'config';
import { DynamoDB, AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import dynamoDb from '../index';
import TrendingResource from '../../api/models/trendingResource';
import logger from '../../logger';

const createTable = (): void => {
  const params: DynamoDB.CreateTableInput = {
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
    TableName: TrendingResource.TABLE_NAME,
    StreamSpecification: {
      StreamEnabled: false,
    },
  };

  dynamoDb.createTable(params, (err: AWSError, data: DynamoDB.CreateTableOutput) => {
    if (err) {
      logger().error(`Error creating ${TrendingResource.TABLE_NAME} table.`, err);
    } else {
      logger().info(`Created ${TrendingResource.TABLE_NAME} table.`, data);
    }
  });
};

logger().info('Accessing dynamoDb:', config.get('aws.dynamodb'));
createTable();

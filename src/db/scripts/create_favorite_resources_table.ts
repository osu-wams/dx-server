/* eslint-disable no-console */

import config from 'config';
import AWS, { AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import dynamoDb from '../index';
import FavoriteResource from '../../api/models/favoriteResource';
import logger from '../../logger';

const createTable = (): void => {
  const params: AWS.DynamoDB.CreateTableInput = {
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
    TableName: FavoriteResource.TABLE_NAME,
    StreamSpecification: {
      StreamEnabled: false,
    },
  };

  dynamoDb.createTable(params, (err: AWSError, data: AWS.DynamoDB.CreateTableOutput) => {
    if (err) {
      logger().error(`Error creating ${FavoriteResource.TABLE_NAME} table.`, err);
    } else {
      logger().info(`Created ${FavoriteResource.TABLE_NAME} table.`, data);
    }
  });
};

logger().info('Accessing dynamoDb:', config.get('aws.dynamodb'));
createTable();

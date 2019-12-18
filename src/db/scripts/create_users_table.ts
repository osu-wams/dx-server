/* eslint-disable no-console */

import config from 'config';
import { AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import dynamoDb from '../index';
import User from '../../api/models/user';
import logger from '../../logger';

const createTable = (): void => {
  const params: AWS.DynamoDB.CreateTableInput = {
    AttributeDefinitions: [{ AttributeName: 'osuId', AttributeType: 'N' }],
    KeySchema: [{ AttributeName: 'osuId', KeyType: 'HASH' }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    TableName: User.TABLE_NAME,
    StreamSpecification: {
      StreamEnabled: false
    }
  };

  dynamoDb.createTable(params, (err: AWSError, data: AWS.DynamoDB.CreateTableOutput) => {
    if (err) {
      logger().error(`Error creating ${User.TABLE_NAME} table.`, err);
    } else {
      logger().info(`Created ${User.TABLE_NAME} table.`, data);
    }
  });
};

logger().info('Accessing dynamoDb:', config.get('aws.dynamodb'));
createTable();

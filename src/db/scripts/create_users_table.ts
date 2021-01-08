/* eslint-disable no-console */

import config from 'config';
import { DynamoDB, AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import dynamoDb from '../index';
import { TABLE_NAME, TableDefinition } from '../../api/models/user';
import logger from '../../logger';

const createTable = (): void => {
  dynamoDb.createTable(TableDefinition, (err: AWSError, data: DynamoDB.CreateTableOutput) => {
    if (err) {
      logger().error(`Error creating ${TABLE_NAME} table.`, err);
    } else {
      logger().info(`Created ${TABLE_NAME} table.`, data);
    }
  });
};

logger().info('Accessing dynamoDb:', config.get('aws.dynamodb'));
createTable();

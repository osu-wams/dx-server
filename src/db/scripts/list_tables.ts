/* eslint-disable no-console */

import config from 'config';
import { DynamoDB, AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import dynamoDb from '../index';
import logger from '../../logger';

logger().info('Accessing dynamoDb:', config.get('aws.dynamodb'));
dynamoDb.listTables((err: AWSError, data: DynamoDB.ListTablesOutput) => {
  if (err) logger().error(err);
  logger().info(data);
});

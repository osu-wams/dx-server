/* eslint-disable no-console */

import { DynamoDB, AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import { DYNAMODB } from '../../constants';
import dynamoDb from '../index';

console.info('Accessing dynamoDb:', DYNAMODB);
dynamoDb.listTables((err: AWSError, data: DynamoDB.ListTablesOutput) => {
  if (err) console.error(err);
  console.info(data);
});

/* eslint-disable no-console */

import config from 'config';
import { AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import dynamoDb from '../index';

console.log('Accessing dynamoDb:', config.get('aws.dynamodb'));
dynamoDb.listTables((err: AWSError, data: AWS.DynamoDB.ListTablesOutput) => {
  if (err) console.log(err);
  console.log(data);
});

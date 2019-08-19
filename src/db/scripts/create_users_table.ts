/* eslint-disable no-console */

import config from 'config';
import { AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import dynamoDb from '../index';

const createTable = (): void => {
  const params: AWS.DynamoDB.CreateTableInput = {
    AttributeDefinitions: [{ AttributeName: 'osuId', AttributeType: 'N' }],
    KeySchema: [{ AttributeName: 'osuId', KeyType: 'HASH' }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    TableName: 'Users',
    StreamSpecification: {
      StreamEnabled: false
    }
  };

  dynamoDb.createTable(params, (err: AWSError, data: AWS.DynamoDB.CreateTableOutput) => {
    if (err) {
      console.error('Error creating Users table.', err);
    } else {
      console.log('Created Users table.', data);
    }
  });
};

console.log('Accessing dynamoDb:', config.get('aws.dynamodb'));
createTable();

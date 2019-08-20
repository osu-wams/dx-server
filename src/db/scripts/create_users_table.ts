/* eslint-disable no-console */

import config from 'config';
import { AWSError } from 'aws-sdk'; // eslint-disable-line no-unused-vars
import dynamoDb from '../index';

const tablePrefix = config.get('aws.dynamoDb.tablePrefix');

const createTable = (): void => {
  const params: AWS.DynamoDB.CreateTableInput = {
    AttributeDefinitions: [{ AttributeName: 'osuId', AttributeType: 'N' }],
    KeySchema: [{ AttributeName: 'osuId', KeyType: 'HASH' }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    TableName: `${tablePrefix}:Users`,
    StreamSpecification: {
      StreamEnabled: false
    }
  };

  dynamoDb.createTable(params, (err: AWSError, data: AWS.DynamoDB.CreateTableOutput) => {
    if (err) {
      console.error(`Error creating ${tablePrefix}:Users table.`, err);
    } else {
      console.log(`Created ${tablePrefix}:Users table.`, data);
    }
  });
};

console.log('Accessing dynamoDb:', config.get('aws.dynamodb'));
createTable();

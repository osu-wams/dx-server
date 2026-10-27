import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { AWS_REGION, DYNAMODB_ENDPOINT, ENV } from '../constants';

const isTest = ENV === 'test';

const dynamoDb = new DynamoDBClient({
  region: isTest ? 'localhost' : AWS_REGION,
  endpoint: DYNAMODB_ENDPOINT,
  // The test suite mocks DynamoDB over HTTP, requests must be signed but the credentials are meaningless
  ...(isTest ? { credentials: { accessKeyId: 'test', secretAccessKey: 'test' }, maxAttempts: 1 } : {}),
  ...(isTest ? {} : { requestHandler: { requestTimeout: 12000 } }),
});

export default dynamoDb;

export const DocumentClient = DynamoDBDocumentClient.from(dynamoDb, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

import AWS from 'aws-sdk';
import { AWS_REGION, DYNAMODB_APIVERSION, DYNAMODB_ENDPOINT, ENV } from '../constants';

AWS.config.update({
  region: ENV === 'test' ? 'localhost' : AWS_REGION,
  dynamodb: {
    endpoint: DYNAMODB_ENDPOINT,
    apiVersion: DYNAMODB_APIVERSION,
  },
});

const dynamoDb = new AWS.DynamoDB();
export default dynamoDb;

export const DocumentClient = new AWS.DynamoDB.DocumentClient({
  endpoint: DYNAMODB_ENDPOINT,
  region: ENV === 'test' ? 'localhost' : AWS_REGION,
  apiVersion: DYNAMODB_APIVERSION,
});

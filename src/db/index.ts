import config from 'config';
import AWS from 'aws-sdk';

AWS.config.update({
  region: config.get('aws.region'),
  dynamodb: {
    endpoint: config.get('aws.dynamodb.endpoint'),
    apiVersion: config.get('aws.dynamodb.apiVersion')
  }
});

const dynamoDb = new AWS.DynamoDB();
export default dynamoDb;

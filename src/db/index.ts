import config from 'config';
import AWS from 'aws-sdk';

export const DYNAMODB_ENDPOINT: string = config.get('aws.dynamodb.endpoint');

AWS.config.update({
  region: config.get('aws.region'),
  dynamodb: {
    endpoint: DYNAMODB_ENDPOINT,
    apiVersion: config.get('aws.dynamodb.apiVersion')
  }
});

const dynamoDb = new AWS.DynamoDB();
export default dynamoDb;

export const scan = async (params: AWS.DynamoDB.ScanInput) => {
  return dynamoDb.scan(params).promise();
};

export const updateItem = async (params: AWS.DynamoDB.UpdateItemInput) => {
  return dynamoDb.updateItem(params).promise();
};

export const getItem = async (params: AWS.DynamoDB.GetItemInput) => {
  return dynamoDb.getItem(params).promise();
};

export const putItem = async (params: AWS.DynamoDB.PutItemInput) => {
  return dynamoDb.putItem(params).promise();
};

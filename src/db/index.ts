import config from 'config';
import AWS from 'aws-sdk';
import { ENV } from '../constants';

export const DYNAMODB_ENDPOINT: string = config.get('aws.dynamodb.endpoint');
export const REGION: string = config.get('aws.region');
export const DYNAMODB_APIVERSION: string = config.get('aws.dynamodb.apiVersion');

AWS.config.update({
  region: REGION,
  dynamodb: {
    endpoint: DYNAMODB_ENDPOINT,
    apiVersion: DYNAMODB_APIVERSION,
  },
});

const dynamoDb = new AWS.DynamoDB();
export default dynamoDb;

export const query = async (params: AWS.DynamoDB.QueryInput) => {
  return dynamoDb.query(params).promise();
};

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

export const DocumentClient = new AWS.DynamoDB.DocumentClient({
  endpoint: DYNAMODB_ENDPOINT,
  region: ENV === 'test' ? 'localhost' : REGION,
  apiVersion: DYNAMODB_APIVERSION,
});

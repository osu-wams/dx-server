/* eslint-disable no-console, no-unused-vars */

import config from 'config';
import AWS from 'aws-sdk';
import User from '../../api/models/user';
import '../../logger';

const DYNAMODB_ENDPOINT: string = config.get('aws.dynamodb.endpoint');
const DYNAMODBCLOUD_ENDPOINT: string = config.get('aws.dynamodbCloud.endpoint');
const region = config.get('aws.region') as string;
const apiVersion = config.get('aws.dynamodbCloud.apiVersion') as string;

const cloudDb = new AWS.DynamoDB.DocumentClient({
  endpoint: DYNAMODBCLOUD_ENDPOINT,
  region,
  apiVersion,
});

(async (targetDynamoDb: string, sourceDynamoDb: string) => {
  try {
    if (!targetDynamoDb.includes('localhost') || !sourceDynamoDb) {
      console.error(
        `Cannot sync when target dynamodb (${targetDynamoDb}) is not pointing at localhost, or source dynamodb (${sourceDynamoDb}) is unset. Check config/local.ts and ensure that dynamodb and dynamodbCloud are properly set.`,
      );
    } else {
      const cloudUser = await User.find(parseInt(process.argv[2], 10), cloudDb);

      console.log(cloudUser);
      if (!cloudUser) {
        console.error(`User ${process.argv[2]} not found.`);
      } else {
        // @ts-ignore dynamodb-toolback returns wrapped sets
        const affiliations: string[] = cloudUser.affiliations.values;

        const updatedUser = await User.upsert({
          ...cloudUser,
          affiliations,
        });
        console.log('Upserted user.', updatedUser);
      }
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
})(DYNAMODB_ENDPOINT, DYNAMODBCLOUD_ENDPOINT);

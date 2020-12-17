/* eslint-disable no-console, no-unused-vars */

import config from 'config';
import AWS from 'aws-sdk';
import User from '../../api/models/user';

const DYNAMODB_ENDPOINT: string = config.get('aws.dynamodb.endpoint');
const DYNAMODBCLOUD_ENDPOINT: string = config.get('aws.dynamodbCloud.endpoint');

const dynamoDbCloud = new AWS.DynamoDB({
  region: config.get('aws.region'),
  endpoint: DYNAMODBCLOUD_ENDPOINT,
  apiVersion: config.get('aws.dynamodbCloud.apiVersion'),
});

(async (targetDynamoDb: string, sourceDynamoDb: string) => {
  if (!targetDynamoDb.includes('localhost') || !sourceDynamoDb) {
    console.error(
      `Cannot sync when target dynamodb (${targetDynamoDb}) is not pointing at localhost, or source dynamodb (${sourceDynamoDb}) is unset. Check config/local.ts and ensure that dynamodb and dynamodbCloud are properly set.`,
    );
  } else {
    const dynamoDbUser = await dynamoDbCloud
      .getItem({
        TableName: User.TABLE_NAME,
        Key: {
          osuId: { N: `${process.argv[2]}` },
        },
      })
      .promise();

    if (!dynamoDbUser.Item) {
      console.error(`User ${process.argv[2]} not found.`);
    } else {
      const foundUser = new User({ dynamoDbUser });
      const updatedUser = await User.upsert(foundUser);
      console.log('Upserted user.', updatedUser);
    }
  }
  process.exit();
})(DYNAMODB_ENDPOINT, DYNAMODBCLOUD_ENDPOINT);

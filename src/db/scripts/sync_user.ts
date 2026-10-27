
import config from 'config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import User from '../../api/models/user';

const DYNAMODB_ENDPOINT: string = config.get('aws.dynamodb.endpoint');
const DYNAMODBCLOUD_ENDPOINT: string = config.get('aws.dynamodbCloud.endpoint');
const region = config.get('aws.region') as string;

const cloudDb = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    endpoint: DYNAMODBCLOUD_ENDPOINT,
    region,
  }),
  { marshallOptions: { removeUndefinedValues: true } },
);

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
        const affiliations: string[] = cloudUser.affiliations?.length
          ? cloudUser.affiliations
          : ['employee'];

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

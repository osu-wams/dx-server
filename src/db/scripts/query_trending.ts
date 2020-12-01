/* eslint-disable no-console */
import fs from 'fs';
import { DYNAMODB, DYNAMODB_TABLE_PREFIX } from '../../constants';
import { scan } from '../index';

/**
 * JQ examples;
 *
 * jq '.[]|select(.active.BOOL==false)|.resourceId.S' output.json | wc -l
 * jq '.[]|select(.active.BOOL==true)|.resourceId.S' output.json | wc -l
 */

console.info('Fetching items from DynamoDB:', DYNAMODB);
const output = fs.createWriteStream(process.argv[2]);

const search = async () => {
  const found = [];
  let lastKey;
  do {
    // eslint-disable-next-line
    const results = await scan({
      TableName: `${DYNAMODB_TABLE_PREFIX}-TrendingResources`,
      ExclusiveStartKey: lastKey,
    });
    found.push(...results.Items);
    console.info(`scan returned ${results.Items.length}, total: ${found.length}`);
    lastKey = results.LastEvaluatedKey;
  } while (lastKey);
  output.write(JSON.stringify(found, null, 2));
};

(async () => {
  if (!process.argv[2]) {
    console.error(
      'Missing output filename. ie. yarn ts-node src/db/scripts/query_trending.ts OUTPUT.json',
    );
    process.exit();
  }
  await search();
  console.info('Finished');
  process.exit();
})();

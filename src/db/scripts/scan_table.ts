/* eslint-disable no-console */
import fs from 'fs';
import { DYNAMODB } from '../../constants';
import FavoriteResource from '../../api/models/favoriteResource';
import TrendingResource from '../../api/models/trendingResource';

/**
 * JQ examples;
 *
 * jq '.[]|select(.active.BOOL==false)|.resourceId.S' output.json | wc -l
 * jq '.[]|select(.active.BOOL==true)|.resourceId.S' output.json | wc -l
 */

(async () => {
  if (!process.argv[2] || !process.argv[3]) {
    console.error(
      'Missing output filename. ie. yarn ts-node -T src/db/scripts/scan_table.ts [favorite | trending] [output_filename]',
    );
    process.exit();
  }
  console.info('Fetching all items from DynamoDB table, this may take awhile!', DYNAMODB);
  const output = fs.createWriteStream(process.argv[3]);

  let found;
  switch (process.argv[2].toLowerCase()) {
    case 'favorite':
      found = await FavoriteResource.scanAll();
      break;
    case 'trending':
      found = await TrendingResource.scanAll();
      break;

    default:
      console.error('Table name not recognized. Valid table names: [favorite, trending]');
      process.exit();
      break;
  }

  output.write(JSON.stringify(found, null, 2));
  console.info('Finished');
  process.exit();
})();

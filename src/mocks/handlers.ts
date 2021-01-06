import type { SetupServerApi } from 'msw/node';
import { rest } from 'msw';

/**
 * A general handler for dynamodb requests, since all dynamodb requests are HTTP POST, this handler needs
 * to be capable of responded to #get, #put, #query, and #scan operations.
 * @param server msw node server to #use
 * @param endpoint the dynamodb endpoint for the handler to respond for
 * @param itemMap a map of item responses related to the target dynamodb tablename
 */
export const dynamoDbHandler = (
  server: SetupServerApi,
  itemMap?: { [key: string]: any },
  endpoint: string = 'http://localhost:8000',
) => {
  server.use(
    rest.post(endpoint, async (req, res, ctx) => {
      console.log(req); // debug DDB calls
      const { TableName, Item, KeyConditionExpression, UpdateExpression } = req.body as {
        TableName: string;
        Item: any;
        KeyConditionExpression: string;
        UpdateExpression: string;
      };
      // DDB Put is creating an Item, so just return it as-is mocking a successful creation
      if (Item) {
        return res(ctx.json(Item));
      }

      const ddbResponse = itemMap[TableName];
      if (!ddbResponse) {
        console.log(
          `Item not provided in itemMap for ${TableName}, expecting test to use dynamoDbHandler method to set a valid response. Provided itemMap: ${JSON.stringify(
            itemMap,
          )}`,
        );
        return res(ctx.status(500));
      }

      // DDB Query/Scan with conditions expects a return like { Count: number, ScannedCount: number, Items: DynamoDbItem[] }
      if (KeyConditionExpression) {
        return res(ctx.json(ddbResponse.Query));
      }
      if (UpdateExpression) {
        return res(ctx.json(ddbResponse.Update));
      }
      // DDB Scan with conditions expects a return like { Count: number, ScannedCount: number, Items: DynamoDbItem[] }
      return res(ctx.json(ddbResponse.Query));
    }),
  );
};

export const handlers = [
  rest.post('*', async (req, res, ctx) => {
    console.log('post *', req);
    // Notice no `return res()` statement
  }),
  rest.get('*', async (req, res, ctx) => {
    console.log('get *', req);
    // Notice no `return res()` statement
  }),
];
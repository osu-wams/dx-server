import type { SetupServer } from 'msw/node';
import { http, HttpResponse, passthrough } from 'msw';
import { CACHE_API, OUTLOOK_API, PLANNER_ITEMS_API, READY_EDUCATION_API } from './apis';
import mockedStudent from './ready-education/student.data';

/**
 * A general handler for dynamodb requests, since all dynamodb requests are HTTP POST, this handler needs
 * to be capable of responded to #get, #put, #query, and #scan operations.
 * @param server msw node server to #use
 * @param endpoint the dynamodb endpoint for the handler to respond for
 * @param itemMap a map of item responses related to the target dynamodb tablename
 */
export const dynamoDbHandler = (
  server: SetupServer,
  itemMap?: { [key: string]: any },
  endpoint: string = 'http://localhost:8000',
) => {
  server.use(
    http.post(endpoint, async ({ request }) => {
      const { TableName, Item, KeyConditionExpression, UpdateExpression } = (await request.json()) as {
        TableName: string;
        Item: any;
        KeyConditionExpression: string;
        UpdateExpression: string;
      };
      // DDB Put is creating an Item, so just return it as-is mocking a successful creation
      if (Item) {
        return HttpResponse.json(Item);
      }

      const ddbResponse = itemMap[TableName];
      if (!ddbResponse) {
        console.log(
          `Item not provided in itemMap for ${TableName}, expecting test to use dynamoDbHandler method to set a valid response. Provided itemMap: ${JSON.stringify(
            itemMap,
          )}`,
        );
        return new HttpResponse(null, { status: 500 });
      }

      // DDB Query/Scan with conditions expects a return like { Count: number, ScannedCount: number, Items: DynamoDbItem[] }
      if (KeyConditionExpression) {
        return HttpResponse.json(ddbResponse.Query);
      }
      if (UpdateExpression) {
        return HttpResponse.json(ddbResponse.Update);
      }
      // DDB Scan with conditions expects a return like { Count: number, ScannedCount: number, Items: DynamoDbItem[] }
      return HttpResponse.json(ddbResponse.Query);
    }),
  );
};

export const handlers = [
  http.get(PLANNER_ITEMS_API, async () => {
    return HttpResponse.json([{ assignment: 'test' }], { status: 200 });
  }),
  http.post(OUTLOOK_API, async () => {
    return new HttpResponse(null, { status: 200 });
  }),
  http.get(READY_EDUCATION_API, async () => {
    return HttpResponse.json(mockedStudent, { status: 200 });
  }),
  http.get(CACHE_API, async () => {
    const mockUrlResponse = { bob: 'ross' };
    return HttpResponse.json(mockUrlResponse, { status: 200 });
  }),
  /**
   * Fallback for requests no other handler matched. Requests to the local supertest server pass
   * through, anything else fails with a network error so the tests never reach the real internet.
   * Besides keeping the suite hermetic this avoids a subtle bug: msw intercepts at the socket level
   * and a real keep-alive connection opened by one test file is reused (un-intercepted) by the next
   * test file in the same Jest worker, which made the Canvas OAuth tests fail depending on ordering.
   */
  http.all('*', ({ request }) => {
    const { hostname } = new URL(request.url);
    if (['127.0.0.1', 'localhost', '::1', '[::1]'].includes(hostname)) {
      return passthrough();
    }
    console.warn(`[msw] unhandled request blocked: ${request.method} ${request.url}`);
    return HttpResponse.error();
  }),
];

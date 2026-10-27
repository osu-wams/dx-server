import { beforeEach, beforeAll, afterEach, afterAll, jest } from '@jest/globals';
import { createClient } from 'redis';
import { server } from '@src/mocks/server';
import { dynamoDbHandler } from '@src/mocks/handlers';
import TrendingResource from '@src/api/models/trendingResource';
import FavoriteResource from '@src/api/models/favoriteResource';
import User from '@src/api/models/user';
import { fromDynamoDb } from '@src/mocks/google/trendingResources';
import { mockDynamoDbUser } from '@src/api/models/__mocks__/user';
import { mockDynamoDbFavoriteResource } from '@src/api/models/__mocks__/favoriteResource';

// Replace the redis client with an in-memory mock for the whole test suite
jest.mock('redis', () => jest.requireActual('@src/mocks/redis'));

const redisClient = createClient();

// Establish API mocking before all tests.
// Requests without a matching msw handler are passed through (nock handles most of the API mocking)
beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }));

// Setup the most basic dynamoDbHandlers.
beforeEach(() => {
  const itemMap = {};
  itemMap[TrendingResource.TABLE_NAME] = {
    Query: {
      Count: 1,
      ScannedCount: 1,
      Items: [fromDynamoDb('2020-01-01')[0]],
    },
  };
  itemMap[FavoriteResource.TABLE_NAME] = {
    Query: {
      Count: 1,
      ScannedCount: 1,
      Items: [mockDynamoDbFavoriteResource],
    },
  };
  itemMap[User.TABLE_NAME] = {
    Query: {
      Count: 1,
      ScannedCount: 1,
      Items: [mockDynamoDbUser],
    },
  };
  dynamoDbHandler(server, itemMap);
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers();
  redisClient.flushAll();
});

// Clean up after the tests are finished.
afterAll(() => server.close());

import { beforeEach, beforeAll, afterEach, afterAll, jest } from '@jest/globals'; // eslint-disable-line
import { server } from '@src/mocks/server';
import { dynamoDbHandler } from '@src/mocks/handlers';
import TrendingResource from '@src/api/models/trendingResource';
import FavoriteResource from '@src/api/models/favoriteResource';
import User from '@src/api/models/user';
import { fromDynamoDb } from '@src/mocks/google/trendingResources';
import { mockDynamoDbUser } from '@src/api/models/__mocks__/user';
import { mockDynamoDbFavoriteResource } from '@src/api/models/__mocks__/favoriteResource';
import redis from 'redis';

jest.mock('redis', () => jest.requireActual('redis-mock'));

const redisClient = redis.createClient();

// Establish API mocking before all tests.
beforeAll(() => server.listen());

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
  redisClient.flushall();
});

// Clean up after the tests are finished.
afterAll(() => server.close());

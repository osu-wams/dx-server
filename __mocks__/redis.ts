const redis = jest.genMockFromModule('redis') as any;

const createClient = () => ({
  flushdb: () => {
    // mocked flushdb is a no-op
  },
  on: () => {
    // mocked on is a no-op
  }
});

redis.createClient = createClient;
export default redis;

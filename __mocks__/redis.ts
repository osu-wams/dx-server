const redis = jest.genMockFromModule('redis') as any;

const createClient = () => ({
  flushdb: () => {
    // mocked flushdb is a no-op
  },
  on: () => {
    // mocked on is a no-op
  },
  get: jest.fn((key, cb) => cb()),
  set: jest.fn((key, data, mode, duration, flag, cb) => cb())
});

redis.createClient = createClient;
export default redis;

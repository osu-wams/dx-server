export default {
  env: 'test',
  sessionSecret: 'bobross',
  apiKeys: '[{"key":"blah","isAdmin":false}]',
  appVersion: 'test-123',
  canvasOauth: {
    id: '8675309',
    secret: 'jenny',
  },
  aws: {
    dynamodb: {
      endpoint: 'http://localhost:8000',
    },
  },
};

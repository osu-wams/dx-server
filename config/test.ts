export default {
  env: 'test',
  apiKeys: '[{"key":"blah","isAdmin":false}]',
  canvasOauth: {
    id: '8675309',
    secret: 'jenny'
  },
  aws: {
    dynamodb: {
      endpoint: 'http://localhost:8000'
    }
  }
};

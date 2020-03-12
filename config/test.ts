export default {
  env: 'test',
  sessionSecret: 'bobross',
  encryptionKey: 'thisoneis32characterslong1234567',
  jwtKey: 'this16characters',
  apiKeys: '[{"key":"blah","isAdmin":false}]',
  appVersion: 'test-123',
  google: {
    analyticsViewId: '22202',
    privateKey: 'nah',
    serviceAccountEmail: 'bobross',
  },
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

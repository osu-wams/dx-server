export default {
  env: 'NODE_ENV',
  useMocks: 'USE_MOCKS',
  apiKeys: 'API_KEYS',
  /**
   * Generated during the build process and injected into the container
   */
  appVersion: 'APP_VERSION',
  sessionSecret: 'SESSION_SECRET',
  osuApi: {
    clientId: 'OSU_API_CLIENT_ID',
    clientSecret: 'OSU_API_CLIENT_SECRET',
  },
  canvasApi: {
    token: 'CANVAS_API_TOKEN',
  },
  canvasOauth: {
    id: 'CANVAS_OAUTH_ID',
    secret: 'CANVAS_OAUTH_SECRET',
  },
  saml: {
    cert: 'SAML_CERT',
    pvk: 'SAML_PVK',
  },
  /**
   * Derived from Elasticache endpoint details using Cloudformation
   */
  redis: {
    host: 'REDIS_HOST',
    port: 'REDIS_PORT',
  },
};

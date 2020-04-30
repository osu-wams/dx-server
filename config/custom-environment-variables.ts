export default {
  env: 'NODE_ENV',
  useMocks: 'USE_MOCKS',
  apiKeys: 'API_KEYS',
  /**
   * Generated during the build process and injected into the container
   */
  appVersion: 'APP_VERSION',
  sessionSecret: 'SESSION_SECRET',
  jwtKey: 'JWT_KEY',
  encryptionKey: 'ENCRYPTION_KEY',
  google: {
    analyticsViewId: 'GOOGLE_ANALYTICS_VIEW_ID',
    privateKey: 'GOOGLE_PRIVATE_KEY',
    serviceAccountEmail: 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  },
  osuApi: {
    clientId: 'OSU_API_CLIENT_ID',
    clientSecret: 'OSU_API_CLIENT_SECRET',
  },
  dxMcmApi: {
    token: 'DX_MCM_API_TOKEN',
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

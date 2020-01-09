export default {
  // Overridden by process.env.NODE_ENV
  env: '',
  // Overridden by process.env.USE_MOCKS
  useMocks: '0',
  logLevel: 'debug',
  // Overridden by ENV APP_VERSION
  appVersion: '',
  /**
   * Overridden by process.env.API_KEYS
   * Stringified json for keys and if they have admin access
   ** eg. '[{"key":"somekey", "isAdmin": true}]'
   */
  apiKeys: '',
  dxApi: {
    cacheEndpointSec: '86400',
    baseUrl: 'https://data.dx.oregonstate.edu',
  },
  osuApi: {
    cacheEndpointSec: '3600',
    // Overridden by process.env.OSU_API_CLIENT_ID
    clientId: '',
    // Overridden by process.env.OSU_API_CLIENT_SECRET
    clientSecret: '',
    baseUrl: 'https://oregonstateuniversity-dev.apigee.net/v1',
  },
  canvasApi: {
    cacheEndpointSec: '3600',
    // Overridden by process.env.CANVAS_API_TOKEN
    token: '',
    baseUrl: 'https://oregonstate.beta.instructure.com/api/v1',
  },
  canvasOauth: {
    // Overridden by process.env.CANVAS_OAUTH_ID
    id: '',
    // Overridden by process.env.CANVAS_OAUTH_SECRET
    secret: '',
    callbackUrl: '',
    baseUrl: 'https://oregonstate.beta.instructure.com',
    authUrl: '/login/oauth2/auth',
    tokenUrl: '/login/oauth2/token',
    scope: '',
  },
  raveApi: {
    cacheEndpointSec: '30',
    baseUrl: 'https://www.getrave.com/rss/oregonstate/channel2',
  },
  cachetApi: {
    cacheEndpointSec: '900',
    baseUrl: 'https://status.is.oregonstate.edu/api/v1',
  },
  localist: {
    campusIds: '{"bend":273,"corvallis":272}',
    eventTypes: '{"employee":115615}',
    eventDaysAgo: '30',
    eventDxQuery: 'dxfa',
    cacheEndpointSec: '86400',
    baseUrl: 'https://events.oregonstate.edu/api/2',
    academicCalendarRSS:
      'https://events.oregonstate.edu/widget/view?schools=oregonstate&days=365&num=10&tags=academic+calendar&format=rss',
  },
  saml: {
    // Overridden by process.env.SAML_CERT
    cert: '',
    // Overridden by process.env.SAML_PVK
    pvk: '',
    callbackUrl: '',
    logoutCallbackUrl: '',
  },
  redis: {
    host: '',
    port: '',
  },
  aws: {
    region: 'us-west-2',
    dynamodb: {
      endpoint: 'https://dynamodb.us-west-2.amazonaws.com',
      apiVersion: '2012-08-10',
      tablePrefix: 'development',
    },
  },
};

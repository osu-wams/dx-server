export default {
  env: process.env.NODE_ENV || 'development',
  logLevel: 'debug',
  appVersion: process.env.APP_VERSION || 'development',
  /**
   * API_KEYS is stringified json for keys and if they have admin access
   ** eg. '[{"key":"somekey", "isAdmin": true}]'
   */
  apiKeys: process.env.API_KEYS || '[{"key": "", "isAdmin": false}]',
  dxApi: {
    cacheEndpointSec: process.env.DX_API_CACHE_ENDPOINT_SEC || '86400',
    baseUrl: process.env.DX_API_BASE_URL || 'https://data.dx.oregonstate.edu'
  },
  osuApi: {
    cacheEndpointSec: process.env.OSU_API_CACHE_ENDPOINT_SEC || '3600',
    clientId: '',
    clientSecret: '',
    baseUrl: process.env.OSU_API_BASE_URL || 'https://oregonstateuniversity-dev.apigee.net/v1'
  },
  canvasApi: {
    cacheEndpointSec: process.env.CANVAS_API_CACHE_ENDPOINT_SEC || '86400',
    token: process.env.CANVAS_API_TOKEN || '',
    baseUrl: process.env.CANVAS_API_BASE_URL || 'https://oregonstate.beta.instructure.com/api/v1'
  },
  canvasOauth: {
    id: process.env.CANVAS_OAUTH_ID || '',
    secret: process.env.CANVAS_OAUTH_SECRET || '',
    callbackUrl: process.env.CANVAS_OAUTH_CALLBACK || '',
    baseUrl: process.env.CANVAS_OAUTH_BASE_URL || 'https://oregonstate.beta.instructure.com',
    authUrl: process.env.CANVAS_OAUTH_URL || '/login/oauth2/auth',
    tokenUrl: process.env.CANVAS_OAUTH_TOKEN_URL || '/login/oauth2/token'
  },
  raveApi: {
    cacheEndpointSec: process.env.RAVE_API_CACHE_ENDPOINT_SEC || '3600',
    baseUrl: process.env.RAVE_API_BASE_URL || 'https://www.getrave.com/rss/oregonstate/channel2'
  },
  localist: {
    cacheEndpointSec: process.env.LOCALIST_CACHE_ENDPOINT_SEC || '86400',
    baseUrl: process.env.LOCALIST_BASE_URL || 'https://events.oregonstate.edu/api/2',
    academicCalendarRSS:
      process.env.LOCALIST_ACADEMIC_CALENDAR_RSS ||
      'https://events.oregonstate.edu/widget/view?schools=oregonstate&days=365&num=10&tags=academic+calendar&format=rss'
  },
  saml: {
    cert: '',
    pvk: '',
    callbackUrl: '',
    logoutCallbackUrl: ''
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || '6379'
  },
  aws: {
    region: process.env.AWS_REGION || 'us-west-2',
    dynamodb: {
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT || 'https://dynamodb.us-west-2.amazonaws.com',
      apiVersion: process.env.AWS_DYNAMODB_APIVERSION || '2012-08-10',
      tablePrefix: process.env.AWS_DYNAMODB_TABLEPREFIX || 'development'
    }
  }
};

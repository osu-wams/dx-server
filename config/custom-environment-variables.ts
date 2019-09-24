export default {
  logLevel: 'LOGLEVEL',
  apiKeys: 'API_KEYS',
  dxApi: {
    cacheEndpointSec: 'DX_API_CACHE_ENDPOINT_SEC',
    baseUrl: 'DX_API_BASE_URL',
    academicGuid: 'DX_API_ACADEMIC_GUID',
    financialGuid: 'DX_API_FINANCIAL_GUID'
  },
  osuApi: {
    cacheEndpointSec: 'OSU_API_CACHE_ENDPOINT_SEC',
    clientId: 'OSU_API_CLIENT_ID',
    clientSecret: 'OSU_API_CLIENT_SECRET',
    baseUrl: 'OSU_API_BASE_URL'
  },
  canvasApi: {
    cacheEndpointSec: 'CANVAS_API_CACHE_ENDPOINT_SEC',
    token: 'CANVAS_API_TOKEN',
    baseUrl: 'CANVAS_API_BASE_URL'
  },
  canvasOauth: {
    id: 'CANVAS_OAUTH_ID',
    secret: 'CANVAS_OAUTH_SECRET',
    callbackUrl: 'CANVAS_OAUTH_CALLBACK',
    baseUrl: 'CANVAS_OAUTH_BASE_URL',
    authUrl: 'CANVAS_OAUTH_URL',
    tokenUrl: 'CANVAS_OAUTH_TOKEN_URL'
  },
  localist: {
    cacheEndpointSec: 'LOCALIST_CACHE_ENDPOINT_SEC',
    baseUrl: 'LOCALIST_BASE_URL',
    academicCalendarRSS: 'LOCALIST_ACADEMIC_CALENDAR_RSS'
  },
  raveApi: {
    cacheEndpointSec: 'RAVE_API_CACHE_ENDPOINT_SEC',
    baseUrl: 'RAVE_API_BASE_URL'
  },
  saml: {
    cert: 'SAML_CERT',
    pvk: 'SAML_PVK',
    callbackUrl: 'SAML_CALLBACK_URL',
    logoutCallbackUrl: 'SAML_LOGOUT_CALLBACK_URL'
  },
  redis: {
    host: 'REDIS_HOST',
    port: 'REDIS_PORT'
  },
  aws: {
    region: 'AWS_REGION',
    dynamodb: {
      endpoint: 'AWS_DYNAMODB_ENDPOINT',
      apiVersion: 'AWS_DYNAMODB_APIVERSION',
      tablePrefix: 'AWS_DYNAMODB_TABLEPREFIX'
    }
  }
};

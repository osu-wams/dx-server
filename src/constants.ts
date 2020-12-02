import config from 'config';

interface ApiKey {
  key: string;
  isAdmin: boolean;
}

const API_KEYS: ApiKey[] = JSON.parse(config.get('apiKeys'));
const APP_URL_REGEX = RegExp(/^https?:\/\/(\w*.)?my\.oregonstate\.edu\/.*/);
const APP_VERSION: string = config.get('appVersion');
const CANVAS_OAUTH_AUTH_URL: string = config.get('canvasOauth.authUrl');
const CANVAS_OAUTH_BASE_URL: string = config.get('canvasOauth.baseUrl');
const CANVAS_OAUTH_CALLBACK_URL: string = config.get('canvasOauth.callbackUrl');
const CANVAS_OAUTH_ID: string = config.get('canvasOauth.id');
const CANVAS_OAUTH_SCOPE: string = config.get('canvasOauth.scope');
const CANVAS_OAUTH_SECRET: string = config.get('canvasOauth.secret');
const CANVAS_OAUTH_TOKEN_URL: string = config.get('canvasOauth.tokenUrl');
const COOKIE_NAME: string = 'dx';
const DYNAMODB: string = config.get('aws.dynamodb');
const DYNAMODB_TABLE_PREFIX: string = config.get('aws.dynamodb.tablePrefix');
const DX_MCM_BASE_URL: string = config.get('dxMcmApi.baseUrl');
const DX_MCM_CACHE_SEC = parseInt(config.get('dxMcmApi.cacheEndpointSec'), 10);
const DX_MCM_DASHBOARD_CHANNEL = 'dashboard';
const DX_MCM_TOKEN: string = config.get('dxMcmApi.token');
const ENCRYPTION_KEY: string = config.get('encryptionKey');
const ENV: string = config.get('env');
const GOOGLE_ANALYTICS_VIEW_ID: string = config.get('google.analyticsViewId');
const GOOGLE_CACHE_SEC: number = parseInt(config.get('google.cacheEndpointSec'), 10);
const GOOGLE_SERVICE_ACCOUNT_EMAIL: string = config.get('google.serviceAccountEmail');
const GOOGLE_PRIVATE_KEY: string = config.get('google.privateKey');
const GROUPS = {
  admin: 'urn:mace:oregonstate.edu:entitlement:dx:dx-admin',
  masquerade: 'urn:mace:oregonstate.edu:entitlement:dx:dx-masquerade',
};
const IV_LENGTH: number = 16;
const JWT_KEY: string = config.get('jwtKey');
const OSU_API_BASE_URL: string = config.get('osuApi.baseUrl');
const OSU_API_CACHE_SEC: number = parseInt(config.get('osuApi.cacheEndpointSec'), 10);
const OSU_API_CLIENT_ID: string = config.get('osuApi.clientId');
const OSU_API_CLIENT_SECRET: string = config.get('osuApi.clientSecret');
const REDIS_HOST: string = config.get('redis.host');
const REDIS_PORT: number = parseInt(config.get('redis.port'), 10);
const SAML_CALLBACK_URL: string = config.get('saml.callbackUrl');
const SAML_CERT: string = config.get('saml.cert');
const SAML_LOGOUT_CALLBACK_URL: string = config.get('saml.logoutCallbackUrl');
const SAML_PVK: string = config.get('saml.pvk');
const SAML_URL = 'https://login.oregonstate.edu/idp/profile/';
const SAML_LOGOUT = `${SAML_URL}Logout`;
const SESSION_SECRET: string = config.get('sessionSecret');
const USE_MOCKS: number = parseInt(config.get('useMocks'), 10);

const COLLEGES: { [key: string]: string } = {
  'college of agricultural sciences': '1',
  'college of business': '2',
  'college of earth, ocean, and atmospheric sciences': '3',
  'college of education': '4',
  'college of engineering': '5',
  'college of forestry': '6',
  'college of liberal arts': '7',
  'college of pharmacy': '8',
  'college of public health and human sciences': '9',
  'college of science': '10',
  'college of veterinary medicine': '11',
  'graduate school': '12',
  'honors college': '13',
};

export {
  API_KEYS,
  APP_URL_REGEX,
  APP_VERSION,
  CANVAS_OAUTH_AUTH_URL,
  CANVAS_OAUTH_BASE_URL,
  CANVAS_OAUTH_CALLBACK_URL,
  CANVAS_OAUTH_ID,
  CANVAS_OAUTH_SCOPE,
  CANVAS_OAUTH_SECRET,
  CANVAS_OAUTH_TOKEN_URL,
  COLLEGES,
  COOKIE_NAME,
  DYNAMODB,
  DYNAMODB_TABLE_PREFIX,
  DX_MCM_BASE_URL,
  DX_MCM_CACHE_SEC,
  DX_MCM_DASHBOARD_CHANNEL,
  DX_MCM_TOKEN,
  ENCRYPTION_KEY,
  ENV,
  GOOGLE_ANALYTICS_VIEW_ID,
  GOOGLE_CACHE_SEC,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GROUPS,
  IV_LENGTH,
  JWT_KEY,
  OSU_API_BASE_URL,
  OSU_API_CACHE_SEC,
  OSU_API_CLIENT_ID,
  OSU_API_CLIENT_SECRET,
  REDIS_HOST,
  REDIS_PORT,
  SAML_CALLBACK_URL,
  SAML_CERT,
  SAML_LOGOUT,
  SAML_LOGOUT_CALLBACK_URL,
  SAML_PVK,
  SAML_URL,
  SESSION_SECRET,
  USE_MOCKS,
};

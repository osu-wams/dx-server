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
const ENCRYPTION_KEY: string = config.get('encryptionKey');
const ENV: string = config.get('env');
const JWT_KEY: string = config.get('jwtKey');
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
  ENCRYPTION_KEY,
  ENV,
  JWT_KEY,
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

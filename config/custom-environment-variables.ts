export default {
  dxApi: {
    baseUrl: 'DX_API_BASE_URL',
    academicGuid: 'DX_API_ACADEMIC_GUID',
    financialGuid: 'DX_API_FINANCIAL_GUID'
  },
  osuApi: {
    clientId: 'OSU_API_CLIENT_ID',
    clientSecret: 'OSU_API_CLIENT_SECRET'
  },
  canvasApi: {
    token: 'CANVAS_API_TOKEN'
  },
  canvasOauth: {
    id: 'CANVAS_OAUTH_ID',
    secret: 'CANVAS_OAUTH_SECRET',
    callbackUrl: 'CANVAS_OAUTH_CALLBACK'
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
      apiVersion: 'AWS_DYNAMODB_APIVERSION'
    }
  }
};

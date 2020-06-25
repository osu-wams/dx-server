export default {
  env: 'development',
  logLevel: 'silly',
  appVersion: 'development-123',
  dxApi: {
    baseUrl: 'https://data-stage.dx.oregonstate.edu',
  },
  dxMcmApi: {
    baseUrl: 'https://dev.mcm.oregonstate.edu',
  },
  osuApi: {
    baseUrl: 'https://oregonstateuniversity-dev.apigee.net',
  },
  canvasApi: {
    baseUrl: 'https://oregonstate.beta.instructure.com/api/v1',
  },
  saml: {
    callbackUrl: 'https://dev.my.oregonstate.edu/login/saml',
    logoutCallbackUrl: 'https://dev.my.oregonstate.edu/logout/saml',
  },
  canvasOauth: {
    baseUrl: 'https://oregonstate.beta.instructure.com',
    callbackUrl: 'https://dev.my.oregonstate.edu/canvas/auth',
    scope: '',
  },
  aws: {
    dynamodb: {
      tablePrefix: 'development',
    },
  },
};

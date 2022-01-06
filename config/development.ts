export default {
  env: 'development',
  logLevel: 'silly',
  appVersion: 'development-123',
  dxApi: {
    baseUrl: 'https://data-dev.dx.oregonstate.edu',
  },
  dxMcmApi: {
    baseUrl: 'https://dev.mcm.oregonstate.edu',
  },
  osuApi: {
    baseUrl: 'https://oregonstateuniversity-dev.apigee.net',
  },
  canvasApi: {
    baseUrl: 'https://canvas.oregonstate.edu/api/v1',
  },
  saml: {
    callbackUrl: 'https://dev.my.oregonstate.edu/login/saml',
    logoutCallbackUrl: 'https://dev.my.oregonstate.edu/logout/saml',
  },
  canvasOauth: {
    baseUrl: 'https://canvas.oregonstate.edu',
    callbackUrl: 'https://dev.my.oregonstate.edu/canvas/auth',
    scope: '',
  },
  aws: {
    dynamodb: {
      tablePrefix: 'development',
    },
  },
};

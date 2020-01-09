export default {
  env: 'development',
  logLevel: 'silly',
  appVersion: 'development-123',
  osuApi: {
    baseUrl: 'https://oregonstateuniversity-dev.apigee.net/v1',
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

export default {
  env: 'production',
  dxApi: {
    baseUrl: 'https://data.dx.oregonstate.edu',
  },
  osuApi: {
    baseUrl: 'https://api.oregonstate.edu',
  },
  dxMcmApi: {
    baseUrl: 'https://mcm.oregonstate.edu',
  },
  canvasApi: {
    baseUrl: 'https://oregonstate.instructure.com/api/v1',
  },
  saml: {
    callbackUrl: 'https://my.oregonstate.edu/login/saml',
    logoutCallbackUrl: 'https://my.oregonstate.edu/logout/saml',
  },
  canvasOauth: {
    baseUrl: 'https://oregonstate.instructure.com',
    callbackUrl: 'https://my.oregonstate.edu/canvas/auth',
    scope: 'url:GET|/api/v1/planner/items',
  },
  aws: {
    dynamodb: {
      tablePrefix: 'production',
    },
  },
};

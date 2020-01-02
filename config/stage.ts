export default {
  env: 'stage',
  osuApi: {
    baseUrl: 'https://api.oregonstate.edu/v1',
  },
  canvasApi: {
    baseUrl: 'https://oregonstate.instructure.com/api/v1',
  },
  saml: {
    callbackUrl: 'https://stage.my.oregonstate.edu/login/saml',
    logoutCallbackUrl: 'https://stage.my.oregonstate.edu/logout/saml',
  },
  canvasOauth: {
    baseUrl: 'https://oregonstate.instructure.com',
    callbackUrl: 'https://stage.my.oregonstate.edu/canvas/auth',
    scope: 'url:GET|/api/v1/planner/items',
  },
  aws: {
    dynamodb: {
      tablePrefix: 'stage',
    },
  },
};

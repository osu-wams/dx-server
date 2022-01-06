export default {
  env: 'stage',
  dxApi: {
    baseUrl: 'https://data-stage.dx.oregonstate.edu',
  },
  osuApi: {
    baseUrl: 'https://api.oregonstate.edu',
  },
  dxMcmApi: {
    baseUrl: 'https://stage.mcm.oregonstate.edu',
  },
  canvasApi: {
    baseUrl: 'https://canvas.oregonstate.edu/api/v1',
  },
  saml: {
    callbackUrl: 'https://stage.my.oregonstate.edu/login/saml',
    logoutCallbackUrl: 'https://stage.my.oregonstate.edu/logout/saml',
  },
  canvasOauth: {
    baseUrl: 'https://canvas.oregonstate.edu',
    callbackUrl: 'https://stage.my.oregonstate.edu/canvas/auth',
    scope: 'url:GET|/api/v1/planner/items',
  },
  aws: {
    dynamodb: {
      tablePrefix: 'stage',
    },
  },
};

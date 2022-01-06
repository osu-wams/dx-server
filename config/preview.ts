export default {
  env: 'preview',
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
    callbackUrl: 'https://preview.my.oregonstate.edu/login/saml',
    logoutCallbackUrl: 'https://preview.my.oregonstate.edu/logout/saml',
  },
  canvasOauth: {
    baseUrl: 'https://canvas.oregonstate.edu',
    callbackUrl: 'https://preview.my.oregonstate.edu/canvas/auth',
    scope: '',
  },
  aws: {
    dynamodb: {
      tablePrefix: 'preview',
    },
  },
};

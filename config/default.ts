export default {
  env: process.env.NODE_ENV || 'development',
  osuApi: {
    clientId: '',
    clientSecret: '',
    baseUrl: 'https://oregonstateuniversity-dev.apigee.net/v1'
  },
  canvasApi: {
    token: process.env.CANVAS_API_TOKEN || '',
    baseUrl: process.env.CANVAS_API_BASEURL || 'https://oregonstate.test.instructure.com/api/v1'
  },
  canvasOauth: {
    id: process.env.CANVAS_OAUTH_ID || '',
    secret: process.env.CANVAS_OAUTH_SECRET || '',
    callbackUrl: process.env.CANVAS_OAUTH_CALLBACK || '',
    authUrl:
      process.env.CANVAS_OAUTH_AUTHURL ||
      'https://oregonstate.test.instructure.com/login/oauth2/auth',
    tokenUrl:
      process.env.CANVAS_OAUTH_TOKENURL ||
      'https://oregonstate.test.instructure.com/login/oauth2/token'
  },
  raveApi: {
    baseUrl: 'https://www.getrave.com/rss/oregonstate/channel2'
  },
  localist: {
    baseUrl: 'https://events.oregonstate.edu/api/2',
    academicCalendarRSS:
      'https://events.oregonstate.edu/widget/view?schools=oregonstate&days=365&num=10&tags=academic+calendar&format=rss'
  },
  saml: {
    cert: '',
    pvk: '',
    callbackUrl: '',
    logoutCallbackUrl: ''
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || '6379'
  },
  aws: {
    region: process.env.AWS_REGION || 'us-west-2',
    dynamodb: {
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT || 'https://dynamodb.us-west-2.amazonaws.com',
      apiVersion: process.env.AWS_DYNAMODB_APIVERSION || '2012-08-10'
    }
  }
};

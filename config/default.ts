export default {
  env: process.env.NODE_ENV || 'development',
  osuApi: {
    clientId: '',
    clientSecret: '',
    baseUrl: 'https://oregonstateuniversity-dev.apigee.net/v1'
  },
  canvasApi: {
    token: '',
    baseUrl: 'https://oregonstate.test.instructure.com/api/v1'
  },
  canvasOauth: {
    id: '',
    secret: '',
    callbackUrl: '',
    authUrl: 'https://oregonstate.test.instructure.com/login/oauth2/auth',
    tokenUrl: 'https://oregonstate.test.instructure.com/login/oauth2/token'
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
    callbackUrl: ''
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || '6379'
  },
  rds: {
    host: process.env.RDS_HOST || '127.0.0.1',
    port: process.env.RDS_PORT || '3306',
    user: process.env.RDS_USER || 'myosu_dashboard',
    password: process.env.RDS_PASSWORD || 'myosu_dashboard',
    database: process.env.RDS_DATABASE || 'myosu_dashboard'
  },
  honeycomb: {
    writeKey: process.env.HONEYCOMB_WRITEKEY,
    dataset: process.env.HONEYCOMB_DATASET
  }
};

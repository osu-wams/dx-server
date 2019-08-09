export default {
  env: 'production',
  osuApi: {
    baseUrl: 'https://api.oregonstate.edu/v1'
  },
  canvasApi: {
    baseUrl: 'https://oregonstate.instructure.com/api/v1'
  },
  canvasOauth: {
    authUrl: 'https://oregonstate.instructure.com/login/oauth2/auth',
    tokenUrl: 'https://oregonstate.instructure.com/login/oauth2/token'
  },
  raveApi: {
    baseUrl: 'https://www.getrave.com/rss/oregonstate/channel2'
  },
  localist: {
    baseUrl: 'https://events.oregonstate.edu/api/2',
    academicCalendarRSS:
      'https://events.oregonstate.edu/widget/view?schools=oregonstate&days=365&num=10&tags=academic+calendar&format=rss'
  }
};

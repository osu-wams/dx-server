export default {
  env: 'production',
  osuApi: {
    baseUrl: 'https://api.oregonstate.edu/v1'
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

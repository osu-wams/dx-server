export const holdsData = {
  links: {
    self: 'bogus'
  },
  data: {
    attributes: {
      holds: [
        {
          toDate: '2010-01-01',
          webDisplay: true,
          description: 'Expired Hold'
        },
        {
          toDate: '2199-01-01',
          webDisplay: true,
          description: 'Permanent Hold'
        },
        {
          toDate: '2198-01-01',
          webDisplay: false,
          description: 'Not Web Displayed'
        }
      ]
    }
  }
};

export default holdsData;

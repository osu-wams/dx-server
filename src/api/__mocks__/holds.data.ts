export const holdsData = {
  links: {
    self: 'bogus',
  },
  data: {
    attributes: {
      holds: [
        {
          toDate: '2010-01-01',
          fromDate: '2009-10-14',
          webDisplay: true,
          description: 'Expired Hold',
          reason: 'time was up',
        },
        {
          toDate: '2199-01-01',
          fromDate: '2021-12-05',
          webDisplay: true,
          description: 'Permanent Hold',
          reason: 'got to pay',
        },
        {
          toDate: '2198-01-01',
          fromDate: '2050-08-12',
          webDisplay: false,
          description: 'Not Web Displayed',
          reason: 'strange',
        },
      ],
    },
  },
};

export default holdsData;

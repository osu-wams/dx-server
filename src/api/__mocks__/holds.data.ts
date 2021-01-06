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
        },
        {
          toDate: '2199-01-01',
          fromDate: '2021-12-05',
          webDisplay: true,
          description: 'Permanent Hold',
        },
        {
          toDate: '2198-01-01',
          fromDate: '2050-08-12',
          webDisplay: false,
          description: 'Not Web Displayed',
        },
      ],
    },
  },
};

export default holdsData;

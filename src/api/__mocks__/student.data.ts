export const academicStatusData = {
  links: {
    self: 'bogus'
  },
  data: [
    {
      id: '999999999-201901',
      attributes: {
        academicStanding: 'Good Standing',
        term: '201901',
        gpa: [
          {
            creditHoursAttempted: 99
          }
        ]
      }
    },
    {
      id: '999999999-202001',
      attributes: {
        academicStanding: null,
        term: '202001',
        gpa: [
          {
            creditHoursAttempted: 14
          }
        ]
      }
    }
  ]
};

export default academicStatusData;

export const mockAnnouncementResultWithoutRelatedData = [
  {
    id: 'testid1',
    date: '2019-01-01',
    title: 'Academic Announcement',
    body: 'Academic announcement body',
    audiences: [],
    affiliation: [],
    pages: ['Academics']
  }
];

export const mockAnnouncementsData = [
  {
    type: 'node--announcement',
    id: 'testid1',
    date: '2019-01-01',
    title: 'Academic Announcement',
    field_announcement_action: null,
    field_announcement_body: 'Academic announcement body',
    field_affiliation: [],
    field_audience: [],
    field_pages: [
      {
        name: 'Academics'
      }
    ]
  },
  {
    type: 'node--announcement',
    id: 'testid1',
    date: '2019-01-01',
    title: 'Financial Announcement',
    field_announcement_action: {
      title: 'Action Title',
      uri: 'http://somelink'
    },
    field_announcement_body: 'Financial announcement body',
    field_announcement_image: {
      field_media_image: {
        uri: {
          url: '/image_path'
        }
      }
    },
    field_affiliation: [
      {
       name: 'Student'
      }
    ],
    field_audience: [
      {
        name: 'Corvallis'
      },
      { name: 'Bend' }
    ],
    field_pages: [
      {
        name: 'Finances'
      }
    ]
  },
  {
    type: 'node--announcement',
    id: 'testall1',
    date: '2019-01-01',
    title: 'Announcement',
    field_announcement_action: null,
    field_announcement_body: 'Announcement body',
    field_affiliation: [],
    field_audience: [],
    field_pages: []
  }
];

export const mockAcademicAnnouncementResult = [
  {
    id: 'testid1',
    date: '2019-01-01',
    title: 'Academic Announcement',
    body: 'Academic announcement body',
    audiences: [],
    affiliation: [],
    pages: ['Academics']
  },
  {
    id: 'testall1',
    date: '2019-01-01',
    title: 'Announcement',
    body: 'Announcement body',
    affiliation: [],
    audiences: [],
    pages: []
  }
];

export const mockFinancialAnnouncementResult = [
  {
    id: 'testid1',
    date: '2019-01-01',
    title: 'Financial Announcement',
    body: 'Financial announcement body',
    bg_image: 'https://data.dx.oregonstate.edu/image_path',
    affiliation: ['Student'],
    audiences: ['Corvallis', 'Bend'],
    action: { title: 'Action Title', link: 'http://somelink' },
    pages: ['Finances']
  },
  {
    id: 'testall1',
    date: '2019-01-01',
    title: 'Announcement',
    body: 'Announcement body',
    affiliation: [],
    audiences: [],
    pages: []
  }
];

export const mockAnnouncementResult = [
  mockAcademicAnnouncementResult[0],
  mockFinancialAnnouncementResult[0],
  {
    id: 'testall1',
    date: '2019-01-01',
    title: 'Announcement',
    body: 'Announcement body',
    affiliation: [],
    audiences: [],
    pages: []
  }
];

export default mockAnnouncementsData;

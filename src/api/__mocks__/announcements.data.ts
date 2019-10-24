export const mockAnnouncementResult = [
  {
    id: 'testid1',
    type: 'academic_announcements',
    date: '2019-01-01',
    title: 'Academic Announcement',
    body: 'Academic announcement body',
    audiences: []
  },
  {
    id: 'testid1',
    type: 'financial_announcements',
    date: '2019-01-01',
    title: 'Financial Announcement',
    body: 'Financial announcement body',
    bg_image: 'https://data.dx.oregonstate.edu/image_path',
    audiences: ['Corvallis', 'Bend'],
    action: { title: 'Action Title', link: 'http://somelink' }
  }
];

export const mockAnnouncementResultWithoutRelatedData = [
  {
    id: 'testid1',
    type: 'academic_announcements',
    date: '2019-01-01',
    title: 'Academic Announcement',
    body: 'Academic announcement body',
    audiences: []
  }
];

export const mockAnnouncementsData = [
  {
    drupal_internal__name: 'academic_announcements',
    type: 'node--announcement',
    id: 'testid1',
    date: '2019-01-01',
    title: 'Academic Announcement',
    field_announcement_action: null,
    field_announcement_body: 'Academic announcement body',
    field_audience: []
  },
  {
    drupal_internal__name: 'financial_announcements',
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
    field_audience: [
      {
        name: 'Corvallis'
      },
      { name: 'Bend' }
    ]
  }
];

export const mockAnnouncementsEntityQueueData = [
  {
    drupal_internal__name: 'academic_announcements',
    items: [mockAnnouncementsData[0]]
  },
  {
    drupal_internal__name: 'financial_announcements',
    items: [mockAnnouncementsData[1]]
  }
];

export const mockAcademicAnnouncementResult = [
  {
    id: 'testid1',
    type: 'academic_announcements',
    date: '2019-01-01',
    title: 'Academic Announcement',
    body: 'Academic announcement body',
    audiences: []
  }
];

export const mockFinancialAnnouncementResult = [
  {
    id: 'testid1',
    type: 'financial_announcements',
    date: '2019-01-01',
    title: 'Financial Announcement',
    body: 'Financial announcement body',
    bg_image: 'https://data.dx.oregonstate.edu/image_path',
    audiences: ['Corvallis', 'Bend'],
    action: { title: 'Action Title', link: 'http://somelink' }
  }
];

export default mockAnnouncementsData;

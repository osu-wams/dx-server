import { BASE_URL } from '../modules/dx';

export const mockAnnouncementResult = [
  {
    date: null,
    bg_image: `${BASE_URL}/image_path`,
    action: {
      title: null,
      link: null
    }
  }
];

export const mockAnnouncementResultWithoutImage = [
  {
    date: null,
    bg_image: '',
    action: {
      title: null,
      link: null
    }
  }
];

export const mockAnnouncementsData = (id: string) => ({
  data: [
    {
      relationships: {
        field_announcement_image: {
          data: {
            id
          }
        }
      },
      attributes: {
        background_image: ''
      }
    }
  ],
  included: [
    {
      id,
      relationships: {
        field_media_image: {
          data: {
            id
          }
        }
      },
      attributes: {
        uri: {
          url: '/image_path'
        }
      }
    }
  ]
});

export const mockAnnouncementsEntityQueueData = {
  data: [
    {
      attributes: {
        drupal_internal__name: 'academic_announcements',
        title: 'Academic'
      },
      relationships: {
        items: {
          data: [
            {
              id: 'testid1'
            }
          ]
        }
      }
    },
    {
      attributes: {
        drupal_internal__name: 'financial_announcements',
        title: 'Financial'
      },
      relationships: {
        items: {
          data: [
            {
              id: 'testid2'
            }
          ]
        }
      }
    }
  ],
  included: [
    {
      type: 'node--announcement',
      id: 'testid1',
      attributes: {
        title: 'Academic Announcement',
        field_announcement_action: null,
        field_announcement_body: 'Academic announcement body'
      },
      relationships: {
        field_announcement_image: {
          data: {
            id: 'testid3'
          }
        }
      }
    },
    {
      type: 'node--announcement',
      id: 'testid2',
      attributes: {
        title: 'Financial Announcement',
        field_announcement_action: {
          uri: 'https://oregonstate.edu',
          title: 'Action button'
        },
        field_announcement_body: 'Financial announcement body'
      },
      relationships: {
        field_announcement_image: {
          data: null
        }
      }
    },
    {
      type: 'media--image',
      id: 'testid3',
      relationships: {
        field_media_image: {
          data: {
            id: 'testid4'
          }
        }
      }
    },
    {
      type: 'file--file',
      id: 'testid4',
      attributes: {
        uri: {
          url: '/file/path.jpg'
        }
      }
    }
  ]
};

export const mockAcademicAnnouncementResult = [
  {
    id: 'testid1',
    date: null,
    title: 'Academic Announcement',
    body: 'Academic announcement body',
    bg_image: `${BASE_URL}/file/path.jpg`,
    action: {
      title: null,
      link: null
    }
  }
];

export const mockFinancialAnnouncementResult = [
  {
    id: 'testid2',
    date: null,
    title: 'Financial Announcement',
    body: 'Financial announcement body',
    action: {
      title: 'Action button',
      link: 'https://oregonstate.edu'
    }
  }
];

export default mockAnnouncementsData;

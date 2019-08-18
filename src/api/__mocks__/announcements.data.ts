import { BASE_URL } from '../modules/dx';

export const mockAnnouncementResult = (id: string) => [
  {
    relationships: { field_announcement_image: { data: { id } } },
    attributes: { background_image: `${BASE_URL}/image_path` }
  }
];

export const mockAnnouncementResultWithoutImage = (id: string) => [
  {
    relationships: { field_announcement_image: { data: { id } } },
    attributes: { background_image: '' }
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

export default mockAnnouncementsData;

import request from 'request-promise';
import config from 'config';

export const BASE_URL = config.get('dxApi.baseUrl');
export const ACADEMIC_GUID = config.get('dxApi.academicGuid');
export const FINANCIAL_GUID = config.get('dxApi.financialGuid');
export const INCLUDES =
  'include=field_announcement_image,field_announcement_image.field_media_image';
export const ANNOUNCEMENTS_URL = `${BASE_URL}/jsonapi/node/announcement?${INCLUDES}&sort=-created`;
export const QUEUE_URL = `${BASE_URL}/jsonapi/entity_subqueue/announcements`;

export const getData = async (url: string) => {
  const { data, included } = await request.get(url, { json: true });
  if (included) {
    included.forEach((item: any) => {
      const matchingAnnouncement = data.find((e: any) => {
        return (
          e.relationships.field_announcement_image.data &&
          e.relationships.field_announcement_image.data.id === item.id
        );
      });
      if (matchingAnnouncement) {
        const matchingMedia = included.find((e: any) => {
          return e.id === item.relationships.field_media_image.data.id;
        });
        if (matchingMedia) {
          const matchingIndex = data.indexOf(matchingAnnouncement);
          const matchMediaUrl = `${BASE_URL}${matchingMedia.attributes.uri.url}`;
          data[matchingIndex].attributes.background_image = matchMediaUrl;
        }
      }
    });
  }
  return data;
};

export const getAnnouncements = async (): Promise<any> => {
  try {
    return await getData(ANNOUNCEMENTS_URL);
  } catch (err) {
    throw err;
  }
};

export const getAcademicAnnouncements = async (): Promise<any> => {
  try {
    const url = `${QUEUE_URL}/${ACADEMIC_GUID}/items?${INCLUDES}`;
    return await getData(url);
  } catch (err) {
    throw err;
  }
};

export const getFinancialAnnouncements = async (): Promise<any> => {
  try {
    const url = `${QUEUE_URL}/${FINANCIAL_GUID}/items?${INCLUDES}`;
    return await getData(url);
  } catch (err) {
    throw err;
  }
};

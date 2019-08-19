import request from 'request-promise';
import { Request } from 'express'; // eslint-disable-line no-unused-vars
import config from 'config';

export const BASE_URL = config.get('dxApi.baseUrl');
export const ACADEMIC_GUID = config.get('dxApi.academicGuid');
export const FINANCIAL_GUID = config.get('dxApi.financialGuid');
export const INCLUDES =
  'include=field_announcement_image,field_announcement_image.field_media_image';
export const ANNOUNCEMENTS_URL = `${BASE_URL}/jsonapi/node/announcement?${INCLUDES}&sort=-created`;
export const QUEUE_URL = `${BASE_URL}/jsonapi/entity_subqueue/announcements`;
export const RESOURCES_URL = `${BASE_URL}/jsonapi/node/services?include=field_service_category,field_icon.field_media_image`;
export const CATEGORIES_URL = `${BASE_URL}/jsonapi/taxonomy_term/categories?include=field_taxonomy_icon.field_media_image&sort=weight`;

const getAnnouncementData = async (url: string) => {
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

const getResourceData = async (url: string, match: string) => {
  const { data, included } = await request.get(url, { json: true });
  if (included) {
    included.forEach((item: any) => {
      const matchingItems = data.filter((e: any) => {
        return e.relationships[match].data && e.relationships[match].data.id === item.id;
      });
      if (matchingItems.length > 0) {
        const matchingMedia = included.find((e: any) => {
          return e.id === item.relationships.field_media_image.data.id;
        });
        if (matchingMedia) {
          matchingItems.forEach((matchingItem: any) => {
            const matchingIndex = data.indexOf(matchingItem);
            data[matchingIndex].attributes.icon = `${BASE_URL}${matchingMedia.attributes.uri.url}`;
          });
        }
      }
    });
  }
  return data;
};

export const getAnnouncements = async (): Promise<any> => {
  try {
    return await getAnnouncementData(ANNOUNCEMENTS_URL);
  } catch (err) {
    throw err;
  }
};

export const getAcademicAnnouncements = async (): Promise<any> => {
  try {
    const url = `${QUEUE_URL}/${ACADEMIC_GUID}/items?${INCLUDES}`;
    return await getAnnouncementData(url);
  } catch (err) {
    throw err;
  }
};

export const getFinancialAnnouncements = async (): Promise<any> => {
  try {
    const url = `${QUEUE_URL}/${FINANCIAL_GUID}/items?${INCLUDES}`;
    return await getAnnouncementData(url);
  } catch (err) {
    throw err;
  }
};

export const getResources = async (query: any): Promise<any> => {
  try {
    let requestUrl = RESOURCES_URL;
    if (query.query) {
      requestUrl = `${RESOURCES_URL}&filter[title-filter][condition][path]=title&filter[title-filter][condition][operator]=CONTAINS&filter[title-filter][condition][value]=${
        query.query
      }`;
    } else if (query.category) {
      const categories = query.category.split(',');
      requestUrl = `${RESOURCES_URL}&fields[taxonomy_term--categories]=name&filter[and-group][group][conjunction]=AND`;
      for (let i = 0; i < categories.length; i += 1) {
        requestUrl += `&filter[${categories[i]}][condition][path]=field_service_category.id`;
        requestUrl += `&filter[${categories[i]}][condition][value]=${categories[i]}`;
        if (i === 0) {
          requestUrl += `&filter[${categories[i]}][condition][memberOf]=and-group`;
        }
      }
    }
    return await getResourceData(requestUrl, 'field_icon');
  } catch (err) {
    throw err;
  }
};

export const getCategories = async (): Promise<any> => {
  try {
    return await getResourceData(CATEGORIES_URL, 'field_taxonomy_icon');
  } catch (err) {
    throw err;
  }
};

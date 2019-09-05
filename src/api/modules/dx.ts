import request from 'request-promise';
import { Request } from 'express'; // eslint-disable-line no-unused-vars
import config from 'config';

export const BASE_URL = config.get('dxApi.baseUrl');
export const INCLUDES =
  'include=field_announcement_image,field_announcement_image.field_media_image';
export const ANNOUNCEMENTS_URL = `${BASE_URL}/jsonapi/node/announcement?${INCLUDES}&sort=-created`;
export const QUEUE_URL = `${BASE_URL}/jsonapi/entity_subqueue/announcements`;
export const RESOURCES_URL = `${BASE_URL}/jsonapi/node/services?include=field_service_category,field_icon.field_media_image`;
export const CATEGORIES_URL = `${BASE_URL}/jsonapi/taxonomy_term/categories?include=field_taxonomy_icon.field_media_image&sort=weight`;
export const INFO_URL = `${BASE_URL}/jsonapi/node/information`;

// DX API to filter any alerts that have an expiration date >= to the time of execution, sorted descending order on the expiration date
export const ALERTS_URL = `${BASE_URL}/jsonapi/node/alerts?sort=-field_alert_expiration_date&filter[field_expiration_date][condition][operator]=%3e%3d&filter[field_expiration_date][condition][path]=field_alert_expiration_date&filter[field_expiration_date][condition][value]=${Date.now()}`;

export interface Alert {
  title: string;
  date: Date;
  content: string;
  type: string;
}

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

const getAnnouncementTypeData = async (filter: string) => {
  const url = `${QUEUE_URL}?include=items,items.field_announcement_image,items.field_announcement_image.field_media_image`;
  const { data, included } = await request.get(url, { json: true });
  const results = [];
  if (included !== undefined) {
    const selectedData = data.find((item: any) => {
      return filter === item.attributes.drupal_internal__name;
    });
    selectedData.relationships.items.data.forEach((item: any) => {
      const dataItem = included.find((e: any) => {
        return e.id === item.id;
      });
      if (dataItem === undefined) {
        return;
      }
      // Use find because there's a single iconFile per mediaFile
      const imageFile =
        dataItem.relationships.field_announcement_image.data === null
          ? undefined
          : included.find((e: any) => {
              // Use find because there's a single mediaFile per item
              // (not necessarily the other way though)
              const mediaFile = included.find((a: any) => {
                return a.id === dataItem.relationships.field_announcement_image.data.id;
              });
              if (mediaFile === undefined) {
                return false;
              }
              return e.id === mediaFile.relationships.field_media_image.data.id;
            });
      let bg_image = imageFile;
      if (bg_image !== undefined) {
        bg_image = `${BASE_URL}${imageFile.attributes.uri.url}`;
      }
      const action = dataItem.attributes.field_announcement_action
        ? {
            title: dataItem.attributes.field_announcement_action.title,
            link: dataItem.attributes.field_announcement_action.uri
          }
        : {
            title: null,
            link: null
          };
      results.push({
        id: item.id,
        date: null,
        title: dataItem.attributes.title,
        body: dataItem.attributes.field_announcement_body,
        bg_image,
        action
      });
    });
  }
  return results;
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

const getResourceEntities = async (url: string) => {
  const { data, included } = await request.get(url, { json: true });
  const results = [];
  if (included !== undefined) {
    data[0].relationships.items.data.forEach((item: any) => {
      const dataItem = included.find((e: any) => {
        return e.id === item.id;
      });
      if (dataItem === undefined) {
        return;
      }
      // Use find because there's a single iconFile per mediaFile
      const iconFile =
        dataItem.relationships.field_icon.data === null
          ? undefined
          : included.find((e: any) => {
              // Use find because there's a single mediaFile per item
              // (not necessarily the other way though)
              const mediaFile = included.find((a: any) => {
                return a.id === dataItem.relationships.field_icon.data.id;
              });
              if (mediaFile === undefined) {
                return false;
              }
              return e.id === mediaFile.relationships.field_media_image.data.id;
            });
      let icon = iconFile;
      if (icon !== undefined) {
        icon = `${BASE_URL}${iconFile.attributes.uri.url}`;
      }
      results.push({
        id: item.id,
        title: dataItem.attributes.title,
        icon,
        uri: dataItem.attributes.field_service_url.uri
      });
    });
  }
  return results;
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
    return await getAnnouncementTypeData('academic_announcements');
  } catch (err) {
    throw err;
  }
};

export const getFinancialAnnouncements = async (): Promise<any> => {
  try {
    return await getAnnouncementTypeData('financial_announcements');
  } catch (err) {
    throw err;
  }
};

export const getResources = async (query: any): Promise<any> => {
  try {
    let requestUrl = RESOURCES_URL;
    if (query.machineName) {
      const category = query.machineName;
      requestUrl = `${BASE_URL}/jsonapi/entity_subqueue/${category}?include=items,items.field_icon,items.field_icon.field_media_image&fields[node--services]=title,field_service_url,field_icon`;
      return await getResourceEntities(requestUrl);
    }
    if (query.query) {
      requestUrl = `${RESOURCES_URL}&filter[title-filter][condition][path]=title&filter[title-filter][condition][operator]=CONTAINS&filter[title-filter][condition][value]=${query.query}`;
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

export const getInfo = async (): Promise<any> => {
  try {
    const { data } = await request.get(INFO_URL, { json: true });
    return data;
  } catch (err) {
    throw err;
  }
};

/**
 * Get alerts from DX API.
 * @returns Alert[] - An array of alerts from the API
 */
export const getDxAlerts = async (): Promise<Alert[]> => {
  try {
    const { data } = await request.get(ALERTS_URL, { json: true });
    if (!data || data.length === 0) {
      return [];
    }
    /* eslint-disable camelcase */
    const { field_alert_content, field_alert_type, created, title } = data[0].attributes;
    return [
      {
        content: field_alert_content as string,
        title: title as string,
        date: created as Date,
        type: field_alert_type as string
      }
    ];
    /* eslint-enable camelcase */
  } catch (err) {
    throw err;
  }
};

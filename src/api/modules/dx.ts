import Kitsu from 'kitsu/node';
import config from 'config';
import { IAnnouncementResult } from '../announcements'; // eslint-disable-line no-unused-vars
import { IInfoResult } from '../information'; // eslint-disable-line no-unused-vars
import { IResourceResult, ICategory } from '../resources'; // eslint-disable-line no-unused-vars
import cache, { setCache } from './cache';

export const BASE_URL = config.get('dxApi.baseUrl');
export const CACHE_SEC = parseInt(config.get('dxApi.cacheEndpointSec'), 10);

const api = new Kitsu({
  baseURL: `${BASE_URL}/jsonapi`,
  pluralize: false,
  camelCaseTypes: false,
  resourceCase: 'none'
});

export interface Alert {
  title: string;
  date: Date;
  content: string;
  type: string;
}

export interface Audience {
  id: string;
  name: string;
}

/**
 * Inspect related field_announcement_image to return the url otherwise undefined
 * @param item drupal item including field_announcement_image.field_media_image
 */
const imageUrl = item => {
  if (item.field_announcement_image && item.field_announcement_image.field_media_image) {
    return `${BASE_URL}${item.field_announcement_image!.field_media_image.uri.url}`;
  }
  return undefined;
};

/**
 * Inspect related field_announcement_action to return the title and link otherwise undefined
 * @param item drupal item including field_announcement_action
 */
const itemAction = item => {
  if (item.field_announcement_action) {
    return {
      title: item.field_announcement_action.title,
      link: item.field_announcement_action.uri
    };
  }
  return undefined;
};

/**
 * Inspect the related field_taxonomy_icon to get the images url or default to undefined
 * @param item drupal item including field_taxonomy_icon
 */
const iconUrl = item => {
  if (item.field_icon && item.field_icon.field_media_image) {
    return `${BASE_URL}${item.field_icon!.field_media_image.uri.url}`;
  }
  return undefined;
};

/**
 * Return an array of data reshaped to an array of the announcement results
 * @param items a list of items to reshape as announcement results
 */
const mappedAnnouncements = (items: any[]): IAnnouncementResult[] => {
  return items
    .filter(d => d.title !== undefined)
    .map(d => {
      let audiences = [];
      if (d.field_audience !== undefined) audiences = d.field_audience.map(a => a.name);
      return {
        id: d.id,
        type: d.drupal_internal__name,
        date: d.date,
        title: d.title,
        body: d.field_announcement_body,
        bg_image: imageUrl(d),
        audiences,
        action: itemAction(d)
      };
    });
};

/**
 * Return an array of data reshaped to an array of the resource results
 * @param items a list of items to reshape as resource results
 */
const mappedResources = (items: any[]): IResourceResult[] => {
  return items.map(d => ({
    id: d.id,
    type: d.drupal_internal__name,
    title: d.title,
    link: d.field_service_url.uri,
    icon: iconUrl(d),
    audiences: d.field_audience.map(a => a.name),
    categories: d.field_service_category.map(c => c.name),
    synonyms: d.field_service_synonyms
  }));
};

/**
 * Drupal json API is paginating results by default with a limit of 50 records per query. The "next" page of
 * results are found in the `links.next.href` data. March forward by record offsets to fetch all of the
 * data for this query.
 * @param url the API endpoint to query
 */
const retrieveData = async (url: string, kitsuOpts: any): Promise<any[]> => {
  const cacheKey = `${url}:${JSON.stringify(kitsuOpts)}`;
  const cachedData = await cache.getAsync(cacheKey);
  if (cachedData !== null) return JSON.parse(cachedData);

  const fetchedItems = [];
  let hasItems = true;
  const paginatedOpts = { page: { limit: 50, offset: 0 } };

  /* eslint-disable no-await-in-loop */
  while (hasItems) {
    const response = await api.get(url, { ...kitsuOpts, ...paginatedOpts });
    fetchedItems.push(response.data);
    if (response.data.length === 50) {
      paginatedOpts.page.offset += 50;
    } else {
      hasItems = false;
    }
  }
  // flatten all fetchedItems arrays into a single array, cache the json and return the data
  const data = fetchedItems.reduce((p, c) => p.concat(c));
  await setCache(cacheKey, JSON.stringify(data), { mode: 'EX', duration: CACHE_SEC, flag: 'NX' });
  return data;
};

/**
 * Get all of the announcements from the DX API
 */
export const getAnnouncements = async (): Promise<IAnnouncementResult[]> => {
  try {
    const data = await retrieveData('node/announcement', {
      fields: {
        'node--announcement':
          'id,title,date,field_announcement_body,field_announcement_action,field_announcement_image,field_audience',
        'taxonomy_term--audience': 'name',
        'media--image': 'name,field_media_image',
        'file--file': 'filename,filemime,uri'
      },
      include: 'field_announcement_image,field_announcement_image.field_media_image,field_audience'
    });
    return mappedAnnouncements(data);
  } catch (err) {
    throw err;
  }
};

/**
 * Using the entity subqueue, get all of the announcements for a particular type.
 * @param type the name of the entity subqueue to return announcements for
 */
const getCuratedAnnouncements = async (type: string): Promise<IAnnouncementResult[]> => {
  try {
    const data = await retrieveData('entity_subqueue/announcements', {
      fields: {
        'entity_subqueue--announcements': 'items,drupal_internal__name',
        'node--announcement':
          'id,title,date,field_announcement_body,field_announcement_action,field_announcement_image,field_audience',
        'taxonomy_term--audience': 'name',
        'media--image': 'name,field_media_image',
        'file--file': 'filename,filemime,uri'
      },
      include:
        'items,items.field_announcement_image,items.field_announcement_image.field_media_image,items.field_audience'
    });

    // Find the first matching entity subqueue to return its associated items (announcement nodes)
    /* eslint-disable camelcase */
    const filtered: { drupal_internal__name: string; items: any[] } = data.find(
      (d: { drupal_internal__name: string; items: any[] }) =>
        d.drupal_internal__name.toLowerCase() === type.toLowerCase()
    );
    /* eslint-enable camelcase */
    return mappedAnnouncements(filtered.items);
  } catch (err) {
    throw err;
  }
};

/**
 * Get the academic announcements from the DX API.
 */
export const getAcademicAnnouncements = async (): Promise<IAnnouncementResult[]> => {
  try {
    return getCuratedAnnouncements('academic_announcements');
  } catch (err) {
    throw err;
  }
};

/**
 * Get the financial announcements from the DX API.
 */
export const getFinancialAnnouncements = async (): Promise<IAnnouncementResult[]> => {
  try {
    return getCuratedAnnouncements('financial_announcements');
  } catch (err) {
    throw err;
  }
};

/**
 * Get all resources with all associated categories, audiences, synonyms and media for display.
 */
export const getResources = async (): Promise<IResourceResult[]> => {
  try {
    const data = await retrieveData('node/services', {
      fields: {
        'node--services':
          'id,title,field_icon,field_service_category,field_audience,field_service_synonyms,field_service_url',
        'taxonomy_term--categories': 'name',
        'taxonomy_term--audience': 'name',
        'media--image': 'name,field_media_image',
        'file--file': 'filename,filemime,uri'
      },
      include: 'field_service_category,field_icon.field_media_image,field_audience',
      sort: 'title'
    });
    return mappedResources(data);
  } catch (err) {
    throw err;
  }
};

/**
 * Get all resources for a specific category with all associated categories, audiences, synonyms and media for display.
 */
export const getCuratedResources = async (category: string): Promise<IResourceResult[]> => {
  try {
    const data = await retrieveData(`entity_subqueue/${category}`, {
      fields: {
        'entity_subqueue--services': 'items,drupal_internal__name',
        'node--services':
          'id,title,field_icon,field_service_category,field_audience,field_service_synonyms,field_service_url',
        'taxonomy_term--categories': 'name',
        'taxonomy_term--audience': 'name',
        'media--image': 'name,field_media_image',
        'file--file': 'filename,filemime,uri'
      },
      include:
        'items,items.field_service_category,items.field_icon.field_media_image,items.field_audience'
    });

    return mappedResources(data[0].items);
  } catch (err) {
    throw err;
  }
};

/**
 * Get all categories from DX API.
 */
export const getCategories = async (): Promise<ICategory[]> => {
  try {
    const data = await retrieveData('taxonomy_term/categories', {
      fields: {
        'taxonomy_term--categories': 'id,name,field_taxonomy_icon',
        'media--image': 'name,field_media_image',
        'file--file': 'filename,filemime,uri'
      },
      include: 'field_taxonomy_icon.field_media_image',
      sort: 'weight'
    });

    const categoryIconUrl = item => {
      if (item.field_taxonomy_icon && item.field_taxonomy_icon.field_media_image) {
        return `${BASE_URL}${item.field_taxonomy_icon!.field_media_image.uri.url}`;
      }
      return undefined;
    };

    return data.map(d => ({
      id: d.id,
      name: d.name,
      icon: categoryIconUrl(d)
    }));
  } catch (err) {
    throw err;
  }
};

/**
 * Get information button data from DX API.
 */
export const getInfo = async (): Promise<IInfoResult[]> => {
  try {
    const data = await retrieveData('node/information', {});
    return data.map(d => ({
      title: d.title,
      id: d.field_machine_name,
      content: d.body.processed
    }));
  } catch (err) {
    throw err;
  }
};

/**
 * Get alerts from DX API.
 * ! The nature of retrieveData method and caching would cause these calls to
 * ! continually fetch new data and cache, so we're rounding the 'Date.now()` to the
 * ! next 30sec interval to get the benefit of some caching but also filtering on the backend
 * @returns Alert[] - An array of alerts from the API
 */
export const getDxAlerts = async (): Promise<Alert[]> => {
  // TODO: Round the time up to the next 30 sec interval
  try {
    const data = await retrieveData('node/alerts', {
      filter: {
        field_expiration_date: {
          condition: {
            operator: '>',
            path: 'field_alert_expiration_date',
            value: Date.now()
          }
        }
      },
      sort: '-field_alert_expiration_date'
    });
    if (data.length === 0) return [];

    /* eslint-disable camelcase */
    const { field_alert_content, field_alert_type, created, title } = data[0];
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

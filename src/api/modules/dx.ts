import Kitsu from 'kitsu/node';
import config from 'config';
import { IAnnouncementResult } from '../announcements'; // eslint-disable-line no-unused-vars
import { IInfoResult } from '../information'; // eslint-disable-line no-unused-vars
import { IResourceResult, ICategory, IEntityQueueResourceResult } from '../resources'; // eslint-disable-line no-unused-vars
import cache, { setCache } from './cache';
import { fetchData } from '../util';
import {
  mockedAnnouncements,
  mockedAlerts,
  mockedCategories,
  mockedCuratedResources,
  mockedInformation,
  mockedResources,
} from '../../mocks/dx';

export const BASE_URL: string = config.get('dxApi.baseUrl');
export const CACHE_SEC = parseInt(config.get('dxApi.cacheEndpointSec'), 10);

const api = new Kitsu({
  baseURL: `${BASE_URL}/jsonapi`,
  pluralize: false,
  camelCaseTypes: false,
  resourceCase: 'none',
});

export interface Alert {
  title: string;
  date: Date;
  content: string;
  type: string;
}

/**
 * Inspect related field_announcement_image to return the url otherwise undefined
 * @param item drupal item including field_announcement_image.field_media_image
 */
const imageUrl = (item) => {
  if (item.field_announcement_image && item.field_announcement_image.field_media_image) {
    return `${BASE_URL}${item.field_announcement_image!.field_media_image.uri.url}`;
  }
  return undefined;
};

/**
 * Inspect related field_announcement_action to return the title and link otherwise undefined
 * @param item drupal item including field_announcement_action
 */
const itemAction = (item) => {
  if (item.field_announcement_action) {
    return {
      title: item.field_announcement_action.title,
      link: item.field_announcement_action.uri,
    };
  }
  return undefined;
};

/**
 * Return an array of data reshaped to an array of the announcement results
 * @param items a list of items to reshape as announcement results
 */
const mappedAnnouncements = (items: any[]): IAnnouncementResult[] => {
  return items
    .filter((d) => d.title !== undefined)
    .map((d) => {
      let audiences = [];
      let pages = [];
      let affiliation = [];
      if (d.field_audience !== undefined) audiences = d.field_audience.map((a) => a.name);
      if (d.field_pages !== undefined) pages = d.field_pages.map((a) => a.name);
      if (d.field_affiliation !== undefined) affiliation = d.field_affiliation.map((a) => a.name);
      return {
        id: d.id,
        type: d.drupal_internal__name,
        date: d.date,
        title: d.title,
        body: d.field_announcement_body,
        bg_image: imageUrl(d),
        affiliation,
        audiences,
        pages,
        action: itemAction(d),
      };
    });
};

/**
 * Return an array of data reshaped to an array of the resource results
 * @param items a list of items to reshape as resource results
 */
const mappedResources = (items: any[]): IResourceResult[] => {
  return items.map((d) => ({
    id: d.id,
    type: d.drupal_internal__name,
    title: d.title,
    link: d.field_service_url.uri,
    iconName: d.field_icon_name,
    affiliation: d.field_affiliation.map((a) => a.name),
    audiences: d.field_audience.map((a) => a.name),
    categories: d.field_service_category.map((c) => c.name),
    synonyms: d.field_service_synonyms,
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
    const data = await fetchData(
      () =>
        retrieveData('node/announcement', {
          fields: {
            'node--announcement':
              'id,title,date,field_announcement_body,field_announcement_action,field_announcement_image,field_audience,field_pages',
            'taxonomy_term--audience': 'name',
            'taxonomy_term--pages': 'name',
            'media--image': 'name,field_media_image',
            'file--file': 'filename,filemime,uri',
          },
          include:
            'field_announcement_image,field_announcement_image.field_media_image,field_audience,field_pages',
          filter: {
            status: 1,
          },
        }),
      mockedAnnouncements,
    );
    return mappedAnnouncements(data);
  } catch (err) {
    throw err;
  }
};

/**
 * Get all resources with all associated categories, audiences, synonyms and media for display.
 */
export const getResources = async (): Promise<IResourceResult[]> => {
  try {
    const data = await fetchData(
      () =>
        retrieveData('node/services', {
          fields: {
            'node--services':
              'id,title,field_icon_name,field_service_category,field_affiliation,field_audience,field_service_synonyms,field_service_url',
            'taxonomy_term--categories': 'name',
            'taxonomy_term--audience': 'name',
            'taxonomy_term--affiliation': 'name',
          },
          include: 'field_affiliation,field_audience,field_service_category',
          sort: 'title',
          filter: {
            status: 1,
          },
        }),
      mockedResources,
    );
    return mappedResources(data);
  } catch (err) {
    throw err;
  }
};

/**
 * Get all resources for a specific category with all associated categories, audiences, synonyms and media for display.
 */
export const getCuratedResources = async (
  category: string,
): Promise<IEntityQueueResourceResult> => {
  try {
    const data = await fetchData(
      () =>
        retrieveData(`entity_subqueue/${category}`, {
          fields: {
            'entity_subqueue--services': 'items,drupal_internal__name',
            'node--services':
              'id,title,field_icon_name,field_affiliation,field_audience,field_service_category,field_service_synonyms,field_service_url',
            'taxonomy_term--categories': 'name',
            'taxonomy_term--audience': 'name',
            'taxonomy_term--affiliation': 'name',
          },
          include:
            'items,items.field_affiliation,items.field_audience,items.field_service_category',
        }),
      mockedCuratedResources(category),
    );

    let entityQueueTitle = data[0]?.title;

    // Remove everything before a colon to clean up the name. "Employee: Featured" becomes simply "Featured"
    if (entityQueueTitle?.indexOf(':') > -1) {
      // eslint-disable-next-line no-unused-vars
      const [affiliationToDiscard, queueTitle] = entityQueueTitle.split(':');
      entityQueueTitle = queueTitle;
    }

    // Clean up the results and include the entityque title
    const entityqueueResources = {
      entityQueueTitle,
      items: mappedResources(data[0].items),
    };

    return entityqueueResources;
  } catch (err) {
    throw err;
  }
};

/**
 * Get all categories from DX API.
 */
export const getCategories = async (): Promise<ICategory[]> => {
  try {
    const data = await fetchData(
      () =>
        retrieveData('taxonomy_term/categories', {
          fields: {
            'taxonomy_term--categories': 'id,name,field_taxonomy_icon',
            'media--image': 'name,field_media_image',
            'file--file': 'filename,filemime,uri',
          },
          include: 'field_taxonomy_icon.field_media_image',
          sort: 'weight',
          filter: {
            status: 1,
          },
        }),
      mockedCategories,
    );

    const categoryIconUrl = (item) => {
      if (item.field_taxonomy_icon && item.field_taxonomy_icon.field_media_image) {
        return `${BASE_URL}${item.field_taxonomy_icon!.field_media_image.uri.url}`;
      }
      return undefined;
    };

    return data.map((d) => ({
      id: d.id,
      name: d.name,
      icon: categoryIconUrl(d),
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
    const data = await fetchData(
      () =>
        retrieveData('node/information', {
          fields: {
            'node--information': 'title,field_machine_name,body',
          },
          filter: {
            status: 1,
          },
        }),
      mockedInformation,
    );
    return data.map((d) => ({
      title: d.title,
      id: d.field_machine_name,
      content: d.body.processed,
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
    const data = await fetchData(
      () =>
        retrieveData('node/alerts', {
          filter: {
            field_expiration_date: {
              condition: {
                operator: '>',
                path: 'field_alert_expiration_date',
                value: new Date().toISOString(),
              },
            },
            status: 1,
          },
          fields: {
            'node--alerts': 'title,created,field_alert_content,field_alert_type',
          },
          sort: '-field_alert_expiration_date',
        }),
      mockedAlerts,
    );
    if (data.length === 0) return [];

    /* eslint-disable camelcase */
    const { field_alert_content, field_alert_type, created, title } = data[0];
    return [
      {
        content: field_alert_content as string,
        title: title as string,
        date: created as Date,
        type: field_alert_type as string,
      },
    ];
    /* eslint-enable camelcase */
  } catch (err) {
    throw err;
  }
};

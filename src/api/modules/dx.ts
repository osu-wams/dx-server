import Kitsu from 'kitsu/node';
import config from 'config';
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import {
  mockedAnnouncements,
  mockedAlerts,
  mockedCategories,
  mockedCuratedResources,
  mockedCards,
  mockedInformation,
  mockedResources,
  mockedPageContent,
  mockedReleaseNotes,
  mockedTrainings,
  mockedTrainingTags,
} from '../../mocks/dx';
import { IAnnouncementResult } from '../announcements'; // eslint-disable-line no-unused-vars
import { IInfoResult } from '../information'; // eslint-disable-line no-unused-vars
import { IReleaseNotes } from '../releaseNotes'; // eslint-disable-line no-unused-vars
import { IPageContent } from '../pageContent'; // eslint-disable-line no-unused-vars
import cache, { setCache } from './cache';
import { fetchData, sortBy } from '../util';

export const BASE_URL: string = config.get('dxApi.baseUrl');
export const CACHE_SEC = parseInt(config.get('dxApi.cacheEndpointSec'), 10);
export const LONG_CACHE_SEC = parseInt(config.get('dxApi.longCacheEndpointSec'), 10);

const api = new Kitsu({
  baseURL: `${BASE_URL}/jsonapi`,
  pluralize: false,
  camelCaseTypes: false,
  resourceCase: 'none',
});

/**
 * Inspect related field_announcement_image to return the url otherwise undefined
 * @param item drupal item including field_announcement_image.field_media_image
 */
const imageUrl = (item) => {
  if (item.field_announcement_image?.field_media_image?.uri?.url) {
    return `${BASE_URL}${item.field_announcement_image.field_media_image.uri.url}`;
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
      let locations = [];
      if (d.field_audience !== undefined)
        audiences = d.field_audience.map((a) => a.name).filter(Boolean);
      if (d.field_pages !== undefined) pages = d.field_pages.map((a) => a.name).filter(Boolean);
      if (d.field_affiliation !== undefined)
        affiliation = d.field_affiliation.map((a) => a.name).filter(Boolean);
      if (d.field_locations !== undefined)
        locations = d.field_locations.map((a) => a.name).filter(Boolean);
      return {
        id: d.id,
        type: d.drupal_internal__name,
        date: d.date,
        title: d.title,
        body: d.field_announcement_body,
        bg_image: imageUrl(d),
        affiliation,
        locations,
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
const mappedResources = (items: any[]): Types.Resource[] => {
  return items.map((d) => ({
    id: d.id,
    type: d.drupal_internal__name,
    title: d.title,
    link: d.field_service_url?.uri,
    iconName: d.field_icon_name,
    affiliation: d.field_affiliation.map((a) => a.name).filter(Boolean),
    locations: d.field_locations.map((a) => a.name).filter(Boolean),
    audiences: d.field_audience.map((a) => a.name).filter(Boolean),
    categories: d.field_service_category.map((c) => c.name).filter(Boolean),
    synonyms: d.field_service_synonyms,
    excludeTrending: d.field_exclude_trending,
  }));
};

/**
 * Drupal json API is paginating results by default with a limit of 50 records per query. The "next" page of
 * results are found in the `links.next.href` data. March forward by record offsets to fetch all of the
 * data for this query.
 * @param url the API endpoint to query
 */
const retrieveData = async (url: string, kitsuOpts: any, cacheSec?: number): Promise<any[]> => {
  const cacheKey = `${url}:${JSON.stringify(kitsuOpts)}`;
  const cachedData = await cache.getAsync(cacheKey);
  if (cachedData !== null) return JSON.parse(cachedData);

  const fetchedItems = [];
  let hasItems = true;
  const paginatedOpts = { page: { limit: kitsuOpts?.page?.limit ?? 50, offset: 0 } };

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
  await setCache(cacheKey, JSON.stringify(data), {
    mode: 'EX',
    duration: cacheSec || CACHE_SEC,
    flag: 'NX',
  });
  return data;
};

/**
 * Get all of the announcements from the DX API
 */
export const getAnnouncements = async (): Promise<IAnnouncementResult[]> => {
  const data = await fetchData(
    () =>
      retrieveData('node/announcement', {
        fields: {
          'node--announcement':
            'id,title,date,field_announcement_body,field_announcement_action,field_announcement_image,field_audience,field_pages,field_locations,field_affiliation',
          'taxonomy_term--audience': 'name',
          'taxonomy_term--affiliation': 'name',
          'taxonomy_term--pages': 'name',
          'taxonomy_term--locations': 'name',
          'media--image': 'name,field_media_image',
          'file--file': 'filename,filemime,uri',
        },
        include:
          'field_announcement_image,field_announcement_image.field_media_image,field_affiliation,field_audience,field_pages,field_locations',
        filter: {
          status: 1,
        },
      }),
    mockedAnnouncements,
  );
  return mappedAnnouncements(data);
};

/**
 * Get all resources with all associated categories, audiences, synonyms and media for display.
 */
export const getResources = async (): Promise<Types.Resource[]> => {
  const opts = {
    fields: {
      'node--services':
        'id,title,field_exclude_trending,field_icon_name,field_service_category,field_affiliation,field_audience,field_service_synonyms,field_service_url,field_locations',
      'taxonomy_term--categories': 'name',
      'taxonomy_term--audience': 'name',
      'taxonomy_term--affiliation': 'name',
      'taxonomy_term--locations': 'name',
    },
    include: 'field_affiliation,field_audience,field_service_category,field_locations',
    sort: 'title',
    filter: {
      status: 1,
    },
  };
  const data = await fetchData(
    () => retrieveData('node/services', opts, LONG_CACHE_SEC),
    mockedResources,
  );
  return mappedResources(data);
};

/**
 * Get all resources for a specific category with all associated categories, audiences, synonyms and media for display.
 */
export const getCuratedResources = async (category: string): Promise<Types.ResourceEntityQueue> => {
  const data = await fetchData(
    () =>
      retrieveData(`entity_subqueue/${category}`, {
        fields: {
          'entity_subqueue--services': 'items,drupal_internal__name',
          'node--services':
            'id,title,field_exclude_trending,field_icon_name,field_affiliation,field_audience,field_service_category,field_service_synonyms,field_service_url,field_locations',
          'taxonomy_term--categories': 'name',
          'taxonomy_term--audience': 'name',
          'taxonomy_term--affiliation': 'name',
          'taxonomy_term--locations': 'name',
        },
        include:
          'items,items.field_affiliation,items.field_audience,items.field_service_category,items.field_locations',
      }),
    mockedCuratedResources(category),
  );

  let entityQueueTitle = data[0]?.title;

  // Remove everything before a colon to clean up the name. "Employee: Featured" becomes simply "Featured"
  if (entityQueueTitle?.indexOf(':') > -1) {
    // eslint-disable-next-line no-unused-vars
    const [affiliationToDiscard, queueTitle] = entityQueueTitle.split(':');
    entityQueueTitle = queueTitle.trim();
  }

  // Clean up the results and include the entityque title
  const entityqueueResources = {
    entityQueueTitle,
    items: mappedResources(data[0].items),
  };

  return entityqueueResources;
};

/**
 * Get all categories from DX API.
 */
export const getCategories = async (): Promise<Types.Category[]> => {
  const data = await fetchData(
    () =>
      retrieveData('taxonomy_term/categories', {
        fields: {
          'taxonomy_term--categories': 'id,name,field_taxonomy_icon,field_taxonomy_affiliation',
          'taxonomy_term--affiliation': 'name',
          'media--image': 'name,field_media_image',
          'file--file': 'filename,filemime,uri',
        },
        include: 'field_taxonomy_icon.field_media_image,field_taxonomy_affiliation',
        sort: 'weight',
        filter: {
          status: 1,
        },
      }),
    mockedCategories,
  );

  const categoryIconUrl = (item) => {
    if (item.field_taxonomy_icon?.field_media_image?.uri?.url) {
      return `${BASE_URL}${item.field_taxonomy_icon.field_media_image.uri.url}`;
    }
    return undefined;
  };

  return data.map((d) => ({
    affiliation: d.field_taxonomy_affiliation.map((a) => a.name),
    id: d.id,
    name: d.name,
    icon: categoryIconUrl(d),
  }));
};

/**
 * Get information button data from DX API.
 */
export const getInfo = async (): Promise<IInfoResult[]> => {
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
    content: d.body?.processed,
  }));
};

/**
 * Get Page Content from DX API
 * @param page string
 * The page matches the taxonomy term in Drupal and must be added there
 */

export const getPageContent = async (pageTitle: string): Promise<IPageContent> => {
  const data = await fetchData(
    () =>
      retrieveData('node/dashboard_content', {
        fields: {
          'node--dashboard_content': 'title,body',
        },
        filter: {
          status: 1,
          'field_pages.name': pageTitle,
        },
        page: {
          limit: 1,
        },
      }),
    mockedPageContent,
  );
  return data.map((d) => ({
    title: d.title,
    content: d.body.processed,
  }));
};

/**
 * Get Page Content from DX API
 * @param page string
 * The page matches the taxonomy term in Drupal and must be added there
 */

export const getReleaseNotes = async (): Promise<IReleaseNotes> => {
  const data = await fetchData(
    () =>
      retrieveData('node/release_notes', {
        fields: {
          'node--release_notes': 'title,body,field_release_notes_date',
        },
        filter: {
          status: 1,
        },
        sort: '-created',
      }),
    mockedReleaseNotes,
  );
  return data
    .map((d) => ({
      title: d.title,
      content: d.body.processed,
      date: d.field_release_notes_date,
    }))
    .slice(0, 6);
};

/**
 * Get alerts from DX API.
 * ! The nature of retrieveData method and caching would cause these calls to
 * ! continually fetch new data and cache, so we're rounding the 'Date.now()` to the
 * ! next 30sec interval to get the benefit of some caching but also filtering on the backend
 * @returns Alert[] - An array of alerts from the API
 */
export const getDxAlerts = async (): Promise<Types.Alert[]> => {
  // TODO: Round the time up to the next 30 sec interval
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
};

/**
 * Get all trainings from DX API.
 */
export const getTrainings = async (): Promise<Types.Training[]> => {
  const data = await fetchData(
    () =>
      retrieveData('node/trainings', {
        fields: {
          'node--trainings':
            'id,title,field_training_audience,field_training_contact,field_training_cost,body,field_training_department,field_training_duration,field_training_featured,field_training_frequency,field_training_prerequisites,field_training_course_design,field_training_image,field_training_tags,field_training_types,field_training_website',
          'taxonomy_term--training_audience': 'name',
          'taxonomy_term--training_course_design': 'name',
          'taxonomy_term--training_tags': 'name',
          'taxonomy_term--training_types': 'name',
          'media--image': 'name,field_media_image',
          'file--file': 'filename,filemime,uri',
        },
        include:
          'field_training_image,field_training_image.field_media_image,field_training_audience,field_training_course_design,field_training_tags,field_training_types',
        filter: {
          status: 1,
        },
      }),
    mockedTrainings,
  );

  const trainingImageUrl = (item) => {
    if (item.field_training_image?.field_media_image?.uri?.url) {
      return `${BASE_URL}${item.field_training_image.field_media_image.uri.url}`;
    }
    return undefined;
  };
  const trainings = data.map((d) => ({
    audiences: d.field_training_audience.map((a) => a.name),
    id: d.id,
    title: d.title,
    image: trainingImageUrl(d),
    contact: d.field_training_contact,
    cost: d.field_training_cost,
    body: d.body?.processed,
    department: d.field_training_department,
    duration: d.field_training_duration,
    featured: d.field_training_featured,
    frequency: d.field_training_frequency,
    prerequisites: d.field_training_prerequisites,
    courseDesign: d.field_training_course_design?.name,
    tags: d.field_training_tags.map((t) => t.name),
    type: d.field_training_types?.name,
    websiteUri: d.field_training_website?.uri,
    websiteTitle: d.field_training_website?.title,
  }));
  return trainings.sort(sortBy(['-featured', 'title']));
};

/**
 * Get all training tags from DX API.
 */
export const getTrainingTags = async (): Promise<Types.TrainingTag[]> => {
  const data = await fetchData(
    () =>
      retrieveData('taxonomy_term/training_tags', {
        fields: {
          'taxonomy_term--training_tags': 'id,name',
        },
        filter: {
          status: 1,
        },
        sort: 'weight',
      }),
    mockedTrainingTags,
  );

  return data.map((d) => ({
    id: d.id,
    name: d.name,
  }));
};

const mappedCards = (items: any[]): Types.DynamicCard[] => {
  return items.map((d) => ({
    id: d.id,
    title: d.title,
    infoButtonId: d.field_machine_name,
    locations: d.field_locations.map((a) => a.name).filter(Boolean),
    affiliation: d.field_affiliation.map((a) => a.name).filter(Boolean),
    pages: d.field_pages.map((a) => a.name).filter(Boolean),
    weight: d.field_weight,
    sticky: d.sticky,
    resources: d.field_resources?.map((a) => a.id).filter(Boolean),
    icon: d.field_icon_name,
    body: d.body?.processed,
    link: d.field_card_footer_link?.uri,
    linkText: d.field_card_footer_link?.title,
    audiences: d.field_audience.map((a) => a.name).filter(Boolean),
  }));
};

const sortedCards = (cards: Types.DynamicCard[]): Types.DynamicCard[] => {
  return cards.sort((a, b) => {
    if (a.weight < b.weight) return -1;
    if (a.weight > b.weight) return 1;
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    return 0;
  });
};

/**
 * Get all custom card data with all associated taxonomy terms
 */
export const getCardContent = async (): Promise<Types.DynamicCard[]> => {
  const opts = {
    fields: {
      'node--content_card':
        'id,title,body,field_card_footer_link,sticky,field_resources,field_machine_name,field_icon_name,field_weight,field_affiliation,field_audience,field_locations,field_pages',
      'taxonomy_term--audience': 'name',
      'taxonomy_term--affiliation': 'name',
      'taxonomy_term--locations': 'name',
      'taxonomy_term--pages': 'name',
      'node--services': 'id',
    },
    include: 'field_affiliation,field_audience,field_locations,field_pages',
    sort: 'title',
    filter: {
      status: 1,
    },
  };
  const data = await fetchData(
    () => retrieveData('node/content_card', opts, LONG_CACHE_SEC),
    mockedCards,
  );
  const cards = mappedCards(data);
  return sortedCards(cards);
};

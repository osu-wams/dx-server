import request from 'request-promise'; // eslint-disable-line no-unused-vars
import { Request } from 'express'; // eslint-disable-line no-unused-vars
import config from 'config';
import { IAnnouncementResult } from '../announcements'; // eslint-disable-line no-unused-vars
import { IResourceResult } from '../resources'; // eslint-disable-line no-unused-vars
import cache from './cache';
import { fdatasync } from 'fs';
import { arrayExpression } from '@babel/types';

export const BASE_URL = config.get('dxApi.baseUrl');
export const CACHE_SEC = parseInt(config.get('dxApi.cacheEndpointSec'), 10);
export const INCLUDES =
  'include=field_announcement_image,field_announcement_image.field_media_image,field_campus';
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

export interface Audience {
  id: string;
  name: string;
}

/**
 * Drupal json API is paginating results by default with a limit of 50 records per query. The "next" page of
 * results are found in the `links.next.href` data. Attempt to follow these links until the complete data set
 * is fetched.
 * @param url the API endpoint to query
 * @param otherParams the API options to include in the request
 */

const retrieveData = async (
  url: string,
  otherParams: request.RequestPromiseOptions
): Promise<{ data: any[]; included: any[] }> => {
  const { data = [], included = [], links } = await cache.get(url, otherParams, true, {
    key: url,
    ttlSeconds: CACHE_SEC
  });

  // Checking to see if pagination is necessary, if not return early
  if (links === undefined || links.next === undefined) return { data, included };
  let nextUrl = links.next.href;

  while (nextUrl !== undefined) {
    /* eslint-disable no-await-in-loop */
    const results = await cache.get(nextUrl, otherParams, true, {
      key: nextUrl,
      ttlSeconds: CACHE_SEC
    });
    /* eslint-enable no-await-in-loop */
    nextUrl = undefined;

    if (results.links.next !== undefined) nextUrl = results.links.next.href;
    if (results.data !== undefined) data.push(...results.data);
    if (results.included !== undefined) included.push(...results.included);
  }
  return { data, included };
};

// const getCampusNameForId

function buildAudienceMapping (includedArray: any[]) {
  let audienceArray: any[] = [];

  includedArray.forEach((item: any) => {
    let audienceId;
    let audienceName;
    if (item.type && item.type === 'taxonomy_term--audience') {
      console.log('item -- ', item)
      audienceId = item.id;
      audienceName = item.attributes.name;
      audienceArray[audienceId] = audienceName;
      // audienceArray.push({id: audienceId, name: audienceName})
      // console.log('audienceArray', audienceArray)
    }
  });

  return audienceArray;
}

function bannerTaxonomyMapping (taxonomy_name: string) {
  let map: any[] = []
  map['Bend'] = 'Oregon State - Cascades'
  map['Corvallis'] = 'Oregon State - Corvallis'
  map['Ecampus'] = 'mapped_ecampus'
  map['First Year'] = 'mapped_first_year'
  map['Graduate'] = 'mapped_graduate'
  map['International'] = 'mapped_international'

  if (typeof map[taxonomy_name] !== 'undefined') {
    console.log(`Mapping found for: ${taxonomy_name}`)
    return map[taxonomy_name]
  }
  console.log(`No mapping found for: ${taxonomy_name}`)
  return taxonomy_name
}


const getAnnouncementData = async (url: string): Promise<any[]> => {
  const { data, included } = await retrieveData(url, { json: true });

  // modifying the data to include a long name for the audience, comes from drupal backend
  const audienceMapping = buildAudienceMapping(included);

  data.forEach((data: any) => {
    if (data.relationships!.field_campus) {
      const fdata = data.relationships.field_campus.data;
      fdata.forEach((aData: any) =>{
        const dataId = aData.id
        console.log(`id:${audienceMapping[dataId]}`)
        aData.full_name = bannerTaxonomyMapping(audienceMapping[dataId]) 
      })
    }
  })

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

const getAnnouncementTypeData = async (filter: string): Promise<IAnnouncementResult[]> => {
  const url = `${QUEUE_URL}?include=items,items.field_announcement_image,items.field_announcement_image.field_media_image`;
  const { data, included } = await retrieveData(url, { json: true });
  if (included === undefined) {
    return [];
  }
  const selectedData = data.find((item: any) => {
    return filter === item.attributes.drupal_internal__name;
  });
  return selectedData.relationships.items.data.map((item: any) => {
    const dataItem = included.find((e: any) => {
      return e.id === item.id;
    });
    if (dataItem === undefined) {
      return undefined;
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
    let bgImage = imageFile;
    if (bgImage !== undefined) {
      bgImage = `${BASE_URL}${imageFile.attributes.uri.url}`;
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
    return {
      id: item.id,
      date: null,
      title: dataItem.attributes.title,
      body: dataItem.attributes.field_announcement_body,
      bg_image: bgImage,
      action
    };
  });
};

/* Pair up resources with their additional icon data from includes */
const getResourceData = async (url: string, match: string): Promise<any[]> => {
  const { data, included } = await retrieveData(url, { json: true });
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

/**
 * Query all of the audiences from the drupal backend jsonapi
 */
const getAudiences = async (): Promise<Audience[]> => {
  const { data } = await retrieveData(`${BASE_URL}/jsonapi/taxonomy_term/audience`, {
    json: true
  });
  return data.map((i: { id: string; attributes: { name: string } }) => ({
    id: i.id,
    name: i.attributes.name
  }));
};

/**
 * Join the resources that have audience fields specified to the name of the audience(s)
 * that it is related to. Return a flat array of the audience names that were found.
 * @param dataItem the data item from the drupal API to merge audiences into
 * @param audiences an array of audiences managed in the drupal API
 */
const mapAudiences = (dataItem, audiences: Audience[]) => {
  return dataItem.relationships.field_audience.data
    .map((d: { id: string }) =>
      audiences
        .filter((aud: Audience) => aud.id === d.id)
        .map((aud: Audience) => aud.name)
        .reduce((a, b) => a.concat(b), [])
    )
    .reduce((a: string[], b: string[]) => a.concat(b), []);
};

/**
 * Query the resource, find an icon if it has one related, and find any
 * audiences that are related.
 * @param url the url for the drupal API
 */
const getResourceEntities = async (url: string): Promise<IResourceResult[]> => {
  const { data, included } = await retrieveData(url, { json: true });
  if (included === undefined) {
    return [];
  }
  const audiences = await getAudiences();

  const results: IResourceResult[] = await Promise.all(
    data[0].relationships.items.data.map(async (item: any) => {
      const dataItem = included.find((e: any) => {
        return e.id === item.id;
      });
      if (dataItem === undefined) {
        return undefined;
      }
      const audiencesForItem = mapAudiences(dataItem, audiences);

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
      return {
        id: item.id,
        title: dataItem.attributes.title,
        icon,
        uri: dataItem.attributes.field_service_url.uri,
        audiences: audiencesForItem
      };
    })
  );
  return results.filter(item => item !== undefined);
};

export const getAnnouncements = async (): Promise<any[]> => {
  try {
    return await getAnnouncementData(ANNOUNCEMENTS_URL);
  } catch (err) {
    throw err;
  }
};

export const getAcademicAnnouncements = async (): Promise<IAnnouncementResult[]> => {
  try {
    return await getAnnouncementTypeData('academic_announcements');
  } catch (err) {
    throw err;
  }
};

export const getFinancialAnnouncements = async (): Promise<IAnnouncementResult[]> => {
  try {
    return await getAnnouncementTypeData('financial_announcements');
  } catch (err) {
    throw err;
  }
};

/* Could probably be split up into three separate functions.
 * Retrieves resources for any situation by calling the appropriate subfunction.
 */
export const getResources = async (query: any): Promise<IResourceResult[] | any[]> => {
  try {
    let requestUrl = RESOURCES_URL;
    if (query.machineName) {
      const category = query.machineName;
      requestUrl = `${BASE_URL}/jsonapi/entity_subqueue/${category}?include=items,items.field_icon,items.field_icon.field_media_image&fields[node--services]=title,field_service_url,field_icon,field_audience`;
      return await getResourceEntities(requestUrl);
    }
    if (query.query) {
      requestUrl += `&filter[title-filter][condition][path]=title&filter[title-filter][condition][operator]=CONTAINS&filter[title-filter][condition][value]=${query.query}`;
    } else if (query.category) {
      const categories = query.category.split(',');
      requestUrl += `&fields[taxonomy_term--categories]=name&filter[and-group][group][conjunction]=AND`;
      for (let i = 0; i < categories.length; i += 1) {
        requestUrl += `&filter[${categories[i]}][condition][path]=field_service_category.id`;
        requestUrl += `&filter[${categories[i]}][condition][value]=${categories[i]}`;
        if (i === 0) {
          requestUrl += `&filter[${categories[i]}][condition][memberOf]=and-group`;
        }
      }
    }

    const audiences = await getAudiences();
    const resources = await getResourceData(requestUrl, 'field_icon');
    const adjusted = resources.map(r => {
      const dataItem = r;
      dataItem.audiences = mapAudiences(dataItem, audiences);
      return dataItem;
    });

    return adjusted;
  } catch (err) {
    throw err;
  }
};

export const getCategories = async (): Promise<any[]> => {
  try {
    return await getResourceData(CATEGORIES_URL, 'field_taxonomy_icon');
  } catch (err) {
    throw err;
  }
};

export const getInfo = async (): Promise<any[]> => {
  try {
    const { data } = await retrieveData(INFO_URL, { json: true });
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
    const { data } = await retrieveData(ALERTS_URL, { json: true });
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

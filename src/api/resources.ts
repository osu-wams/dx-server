/**
 * /api/resources
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import request from 'request-promise';

const baseUrl: string = 'http://dev-api-dx.pantheonsite.io';
const servicesUrl: string = `${baseUrl}/jsonapi/node/services?include=field_service_category,field_icon.field_media_image`;
const categoriesUrl: string = `${baseUrl}/jsonapi/taxonomy_term/categories?include=field_taxonomy_icon.field_media_image&sort=weight`;

const router = Router();

const getData = async (url: string, match: string) => {
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
            data[data.indexOf(matchingItem)].attributes.icon = `${baseUrl}${
              matchingMedia.attributes.uri.url
            }`;
          });
        }
      }
    });
  }
  return data;
};

// TODO add interface
interface FilterResultObject {
  id: string;
  title: string;
  icon: string;
  field_service_description: string;
  uri: string;
}

/**
 * Takes an array of API results and filters out unnessesary 
 * data for use in the /results?query route.
 * @param data Array of API results
 * @returns Array of filtered results
 */
const filterResults = (data):Array<FilterResultObject> => {
  // Map over each element of data returning a new condensed obj.
  return data.map(item => {
    const { id, attributes } = item;
    const { field_service_url, title, icon, field_service_description } = attributes;
    const { uri } = field_service_url;
    return {
      id,
      title,
      icon, 
      field_service_description,
      uri,
    }
  })
};

router.get('/', async (req: Request, res: Response) => {
  try {
    let requestUrl = servicesUrl;
    if (req.query.query) {
      requestUrl = `${servicesUrl}&filter[title-filter][condition][path]=title&filter[title-filter][condition][operator]=CONTAINS&filter[title-filter][condition][value]=${
        req.query.query
      }`;
    } else if (req.query.category) {
      const categories = req.query.category.split(',');
      requestUrl = `${servicesUrl}&fields[taxonomy_term--categories]=name&filter[and-group][group][conjunction]=AND`;
      for (let i = 0; i < categories.length; i += 1) {
        requestUrl += `&filter[${categories[i]}][condition][path]=field_service_category.id`;
        requestUrl += `&filter[${categories[i]}][condition][value]=${categories[i]}`;
        if (i === 0) {
          requestUrl += `&filter[${categories[i]}][condition][memberOf]=and-group`;
        }
      }
    }

    const data = await getData(requestUrl, 'field_icon');
    const filteredData = filterResults(data);

    res.send(filteredData);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const data = await getData(categoriesUrl, 'field_taxonomy_icon');
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;

/**
 * /api/persons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import config from 'config';
import logger from '../logger';
import { getToken } from './util';
import { asyncTimedFunction } from '../tracer';
import cache from './modules/cache';

const BASE_URL: string = `${config.get('osuApi.baseUrl')}/persons`;
const CACHE_SEC = parseInt(config.get('osuApi.cacheEndpointSec'), 10);
const router: Router = Router();

// Main endpoint with general data about the person
router.get('/', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    const apiResponse = (await asyncTimedFunction(
      () => {
        const url = `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}`;
        return cache.get(
          url,
          {
            auth: { bearer: bearerToken },
            json: true
          },
          true,
          {
            key: url,
            ttlSeconds: CACHE_SEC
          }
        );
      },
      'getPersons',
      []
    )) as { data: any };
    res.send(apiResponse.data);
  } catch (err) {
    logger.error(`api/persons failed:`, err);
    res.status(500).send({ message: 'Unable to retrieve person information.' });
  }
});

// Meal Plan by osu id - Apigee endpoint
router.get('/meal-plans', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    const apiResponse = (await asyncTimedFunction(
      () => {
        const url = `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/meal-plans`;
        return cache.get(
          url,
          {
            auth: { bearer: bearerToken },
            json: true
          },
          true,
          {
            key: url,
            ttlSeconds: CACHE_SEC
          }
        );
      },
      'getMealPlans',
      []
    )) as { data: any };
    res.send(apiResponse.data);
  } catch (err) {
    logger.error(`api/persons/meal-plans failed:`, err);
    res.status(500).send({ message: 'Unable to retrieve meal plans.' });
  }
});

// Addresses by osu id - Apigee endpoint
router.get('/addresses', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    const apiResponse = (await asyncTimedFunction(
      () => {
        const url = `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/addresses`;
        return cache.get(
          url,
          {
            auth: { bearer: bearerToken },
            json: true
          },
          true,
          {
            key: url,
            ttlSeconds: CACHE_SEC
          }
        );
      },
      'getAddreses',
      []
    )) as { data: any };
    const mailingAddress = apiResponse.data.find((address: any) => {
      return address.attributes.addressType === 'CM';
    });
    res.send(mailingAddress);
  } catch (err) {
    logger.error(`api/persons/addresses failed:`, err);
    res.status(500).send({ message: 'Unable to retrieve addresses' });
  }
});

export default router;

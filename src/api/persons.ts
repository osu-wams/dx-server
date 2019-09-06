/**
 * /api/persons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import request from 'request-promise';
import config from 'config';
import logger from '../logger';
import { getToken } from './util';
import { asyncTimedFunction } from '../tracer';

const BASE_URL: string = `${config.get('osuApi.baseUrl')}/persons`;
const router: Router = Router();

// Main endpoint with general data about the person
router.get('/', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    const apiResponse = (await asyncTimedFunction(
      () =>
        request({
          method: 'GET',
          url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}`,
          auth: { bearer: bearerToken },
          json: true
        }),
      'getPersons',
      []
    )) as { data: any };
    res.send(apiResponse.data);
  } catch (err) {
    logger.error(`api/persons failed:`, err);
    res.status(500).send('Unable to retrieve person information.');
  }
});

// Meal Plan by osu id - Apigee endpoint
router.get('/meal-plans', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    const apiResponse = (await asyncTimedFunction(
      () =>
        request({
          method: 'GET',
          url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/meal-plans`,
          auth: { bearer: bearerToken },
          json: true
        }),
      'getMealPlans',
      []
    )) as { data: any };
    res.send(apiResponse.data);
  } catch (err) {
    logger.error(`api/persons/meal-plans failed:`, err);
    res.status(500).send('Unable to retrieve meal plans.');
  }
});

// Addresses by osu id - Apigee endpoint
router.get('/addresses', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    const apiResponse = (await asyncTimedFunction(
      () =>
        request({
          method: 'GET',
          url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/addresses`,
          auth: { bearer: bearerToken },
          json: true
        }),
      'getAddreses',
      []
    )) as { data: any };
    const mailingAddress = apiResponse.data.find((address: any) => {
      return address.attributes.addressType === 'CM';
    });
    res.send(mailingAddress);
  } catch (err) {
    logger.error(`api/persons/addresses failed:`, err);
    res.status(500).send('Unable to retrieve addresses');
  }
});

export default router;

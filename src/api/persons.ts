/**
 * /api/persons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getProfile, getMealPlan, getAddresses } from './modules/osu';

const router: Router = Router();

// Main endpoint with general data about the person
router.get('/', async (req: Request, res: Response) => {
  try {
    const response = (await asyncTimedFunction(getProfile, 'getProfile', [req.user])) as {
      data: any;
    };
    res.send(response.data);
  } catch (err) {
    logger.error('api/persons failed:', err);
    res.status(500).send({ message: 'Unable to retrieve person information.' });
  }
});

// Meal Plan by osu id - Apigee endpoint
router.get('/meal-plans', async (req: Request, res: Response) => {
  try {
    const response = (await asyncTimedFunction(getMealPlan, 'getMealPlan', [req.user])) as {
      data: any;
    };
    res.send(response.data);
  } catch (err) {
    logger.error('api/persons/meal-plans failed:', err);
    res.status(500).send({ message: 'Unable to retrieve meal plans.' });
  }
});

// Addresses by osu id - Apigee endpoint
router.get('/addresses', async (req: Request, res: Response) => {
  try {
    const response = (await asyncTimedFunction(getAddresses, 'getAddresses', [req.user])) as {
      data: any;
    };
    const mailingAddress = response.data.find((address: any) => {
      return address.attributes.addressType === 'CM';
    });
    res.send(mailingAddress);
  } catch (err) {
    logger.error('api/persons/addresses failed:', err);
    res.status(500).send({ message: 'Unable to retrieve addresses' });
  }
});

export default router;

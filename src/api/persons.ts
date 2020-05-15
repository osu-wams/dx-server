/**
 * /api/persons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getProfile, getMealPlan, getAddresses } from './modules/osu'; // eslint-disable-line no-unused-vars

const router: Router = Router();

// Main endpoint with general data about the person
router.get('/', async (req: Request, res: Response) => {
  try {
    const response: Types.Profile = await asyncTimedFunction(getProfile, 'getProfile', [req.user]);
    res.send(response);
  } catch (err) {
    logger().error('api/persons failed:', err);
    res.status(500).send({ message: 'Unable to retrieve person information.' });
  }
});

// Meal Plan by osu id - Apigee endpoint
router.get('/meal-plans', async (req: Request, res: Response) => {
  try {
    const response: Types.MealPlan = await asyncTimedFunction(getMealPlan, 'getMealPlan', [
      req.user,
    ]);
    res.send(response);
  } catch (err) {
    logger().error('api/persons/meal-plans failed:', err);
    res.status(500).send({ message: 'Unable to retrieve meal plans.' });
  }
});

// Addresses by osu id - Apigee endpoint
router.get('/addresses', async (req: Request, res: Response) => {
  try {
    const response: Types.Address[] = await asyncTimedFunction(getAddresses, 'getAddresses', [
      req.user,
    ]);
    const mailingAddress = response.find((address: any) => {
      return address.attributes.addressType === 'CM';
    });
    res.send(mailingAddress);
  } catch (err) {
    logger().error('api/persons/addresses failed:', err);
    res.status(500).send({ message: 'Unable to retrieve addresses' });
  }
});

export default router;

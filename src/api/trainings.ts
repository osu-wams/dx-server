/**
 * /api/info-buttons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { getTrainings, getTrainingTypes } from './modules/dx';
import { asyncTimedFunction } from '../tracer';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getTrainings, 'getTrainings', []);
    res.send(result);
  } catch (err) {
    logger().error(`api/trainings failed:`, err);
    res.status(500).send({ message: 'Trainings API queries failed.' });
  }
});

router.get('/types', async (_req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(getTrainingTypes, 'getTrainingTypes', []);
    res.send(data);
  } catch (err) {
    logger().error(`api/trainings/types failed:`, err);
    res.status(500).send({ message: 'Training Types API queries failed.' });
  }
});

export default router;

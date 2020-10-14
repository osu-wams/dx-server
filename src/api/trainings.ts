/**
 * /api/trainings
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { getTrainings, getTrainingTags } from './modules/dx';
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

router.get('/tags', async (_req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(getTrainingTags, 'getTrainingTags', []);
    res.send(data);
  } catch (err) {
    logger().error(`api/trainings/tags failed:`, err);
    res.status(500).send({ message: 'Training Tags API queries failed.' });
  }
});

export default router;

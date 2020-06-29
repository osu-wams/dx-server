/**
 * /api/info-buttons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { getTrainings } from './modules/dx';
import { asyncTimedFunction } from '../tracer';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getTrainings, 'getTrainings', []);
    res.send(result);
  } catch (err) {
    logger().error(`api/trainings failed:`, err);
    res.status(500).send({ message: err });
  }
});

export default router;

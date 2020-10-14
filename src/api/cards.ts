/**
 * /api/cards
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { getCustomCards } from './modules/dx';
import { asyncTimedFunction } from '../tracer';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getCustomCards, 'getCustomCards', []);
    res.send(result);
  } catch (err) {
    logger().error(`api/cards failed:`, err);
    res.status(500).send({ message: 'Cards API queries failed.' });
  }
});

export default router;

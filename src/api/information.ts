/**
 * /api/info-buttons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { getInfo } from './modules/dx';
import { asyncTimedFunction } from '../tracer';

const router = Router();

export interface IInfoResult {
  id: string;
  title: string;
  content: string;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getInfo, 'getInfo', []);
    res.send(result);
  } catch (err) {
    logger().error(`api/information failed:`, err);
    res.status(500).send({ message: err });
  }
});

export default router;

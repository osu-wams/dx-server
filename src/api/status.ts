/**
 * /api/status
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getSystemsStatus } from './modules/cachet';
import { asyncTimedFunction } from '../tracer';
import logger from '../logger';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(getSystemsStatus, `getSystemsStatus`, []);
    res.send(data);
  } catch (err) {
    logger().error(`api/status failed: `, err);
    res.status(500).send({ message: err.message });
  }
});

export default router;

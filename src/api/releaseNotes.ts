/**
 * /api/info-buttons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { getReleaseNotes } from './modules/dx';
import { asyncTimedFunction } from '../tracer';

const router = Router();

// export interface IInfoResult {
//   title: string;
//   content: string;
// }

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getReleaseNotes, `getReleaseNotes`, []);
    res.send(result);
  } catch (err) {
    logger().error(`api/releasae-notes failed:`, err);
    res.status(500).send({ message: err });
  }
});

export default router;

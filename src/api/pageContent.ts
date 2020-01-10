/**
 * /api/info-buttons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { getPageContent } from './modules/dx';
import { asyncTimedFunction } from '../tracer';

const router = Router();

// export interface IInfoResult {
//   title: string;
//   content: string;
// }

router.get('/:pageTitle', async (req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(
      getPageContent,
      `getPageContent:${req.params.pageTitle}`,
      [req.params.pageTitle],
    );
    res.send(result);
  } catch (err) {
    logger().error(`api/page-content failed:`, err);
    res.status(500).send({ message: err });
  }
});

export default router;

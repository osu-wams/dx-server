/**
 * /api/searchIndex
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getSearchIndexPages } from './modules/dx';
import { asyncTimedFunction } from '../tracer';
import logger from '../logger';

const router: Router = Router();

router.get('/pages', async (req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(getSearchIndexPages, `getSearchIndexPages`, []);
    res.send(data);
  } catch (err) {
    logger().error(`api/searchIndex/pages failed: `, err);
    res.status(500).send({ message: 'Search Index Pages API failed.' });
  }
});

export default router;

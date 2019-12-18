/**
 * /api/errors
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';

const router: Router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { error, stack } = req.body;
  logger().error('App Error', { error, stack });
  res.status(200).send();
});

export default router;

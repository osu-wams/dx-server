/**
 * /api/errors
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib';
import logger from '../logger';

const router: Router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { error, stack } = req.body;
  logger().error('App Error', { error, stack });
  res.status(200).send();
});

router.post('/app-message', async (req: Request, res: Response) => {
  const { message }: { message: Types.Message } = req.body;
  logger().error('App Message', message);
  res.status(200).send();
});

export default router;

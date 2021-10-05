/**
 * /api/grouper
 */
import config from 'config';
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getGrouperGroup } from './modules/grouper';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const groups: Object = config.get('grouper.groups');
    const group: string = req.query.group.toString();
    if (!group || !(group in groups)) {
      res.status(400);
      res.send('Invalid grouper group');
    } else {
      const response = await asyncTimedFunction(
        getGrouperGroup,
        'getGrouperGroup',
        [config.get(`grouper.groups.${group}`), ['id']],
      );
      res.send(response);
    }
  } catch (err) {
    logger().error('api/grouper failed:', err);
    res.status(400).send({ message: 'Unable to retrieve grouper group.' });
  }
});

export default router;

/**
 * /api/people
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getDirectory } from './modules/osu'; // eslint-disable-line no-unused-vars

const router: Router = Router();

// Query for people with a name match
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const people: Partial<Types.Directory>[] = await asyncTimedFunction(
      getDirectory,
      'getDirectory',
      [req.params.name],
    );
    res.send(people);
  } catch (err) {
    logger().error('api/directory failed:', err);
    res.status(500).send({ message: 'Unable to retrieve directory information.' });
  }
});

export default router;

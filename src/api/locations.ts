/**
 * /api/locations
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getLocations } from './modules/osu'; // eslint-disable-line no-unused-vars

const router: Router = Router();

// Query for locations with matching text
router.get('/:location', async (req: Request, res: Response) => {
  try {
    const people: Partial<Types.Location>[] = await asyncTimedFunction(
      getLocations,
      'getLocations',
      [req.params.location],
    );
    res.send(people);
  } catch (err) {
    logger().error('api/locations failed:', err);
    res.status(500).send({ message: 'Unable to retrieve location information.' });
  }
});

export default router;

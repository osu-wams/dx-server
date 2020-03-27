/**
 * /api/resources
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getResources, getCuratedResources, getCategories } from './modules/dx';
import { asyncTimedFunction } from '../tracer';
import FavoriteResource from './models/favoriteResource';
import logger from '../logger';
import { getTrendingResources } from './modules/google';
import { getDaysInDuration, computeTrendingResources } from '../utils/resources';
import TrendingResource from './models/trendingResource'; // eslint-disable-line no-unused-vars

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(getResources, `getResources`, [req.query]);
    res.send(data);
  } catch (err) {
    logger().error(`api/resources failed:`, err);
    res.status(500).send({ message: err });
  }
});

router.get('/category/:machineName', async (req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(
      getCuratedResources,
      `getCuratedResources:${req.params.machineName}`,
      [req.params.machineName],
    );

    res.send(data);
  } catch (err) {
    logger().error(`api/resources/category/${req.params.machineName} failed:`, err);
    res.status(500).send({ message: err });
  }
});

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(getCategories, 'getCategories', []);
    res.send(data);
  } catch (err) {
    logger().error(`api/resources/categories failed:`, err);
    res.status(500).send({ message: err });
  }
});

/**
 * Get trending resources for a period of time and a type of user
 * :duration format {#daysAgo} : 4daysAgo
 * :affiliation : 'employee' or 'student'
 */
router.get(
  ['/trending/:period/:affiliation', '/trending/:period'],
  async (req: Request, res: Response) => {
    try {
      const days = getDaysInDuration(req.params.period);
      const affiliation = req.params.affiliation?.toLowerCase();
      const data = [];
      for (let index = 0; index < days.length; index += 1) {
        const resources = await getTrendingResources(days[index][0], days[index][1]); // eslint-disable-line no-await-in-loop
        data.push(...resources);
      }
      res.send(
        computeTrendingResources(
          data,
          new Date().toISOString().slice(0, 10),
          affiliation,
        ).map((t) => ({ ...t, period: req.params.period })),
      );
    } catch (err) {
      logger().error(
        `api/resources/trending/${req.params.duration}/${req.params.affiliation} failed:`,
        err,
      );
      res.status(500).send({ message: err });
    }
  },
);

router.get('/favorites', async (req: Request, res: Response) => {
  try {
    // A race condition happens during the authentication cycle in that
    // the API call can be made prior to a user session being established,
    // the best approach for now is to return an empty array because the
    // API call will be made again in the future with a valid user session.
    // api/user/classification has the same concern.
    if (!req.user) {
      res.send([]);
    } else {
      const osuId =
        req.user.groups.includes('masquerade') && req.user.masqueradeId
          ? req.user.masqueradeId
          : req.user.osuId;
      const data = await FavoriteResource.findAll(osuId, true);
      res.send(data);
    }
  } catch (err) {
    logger().error(`api/resources/favorites failed: ${err.message}, trace: ${err.stack}`);
    res.status(500).send({ message: err });
  }
});

router.post('/favorites', async (req: Request, res: Response) => {
  try {
    const { resourceId, active, order } = req.body;
    const osuId =
      req.user.groups.includes('masquerade') && req.user.masqueradeId
        ? req.user.masqueradeId
        : req.user.osuId;

    const data = await FavoriteResource.upsert({
      active,
      created: new Date().toISOString(),
      order,
      osuId,
      resourceId,
    });
    res.send(data);
  } catch (err) {
    logger().error(`api/resources/favorites failed:`, err);
    res.status(500).send({ message: err });
  }
});

export default router;

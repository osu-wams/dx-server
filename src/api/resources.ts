/**
 * /api/resources
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getResources, getCuratedResources, getCategories } from './modules/dx';
import { asyncTimedFunction } from '../tracer';
import logger from '../logger';
import { getTrendingResources } from './modules/google';
import getDaysInDuration from '../utils/resources';
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
router.get('/trending/:duration/:affiliation', async (req: Request, res: Response) => {
  try {
    const days = getDaysInDuration(req.params.duration);
    const affiliation = req.params.affiliation.toLowerCase();
    const data = [];
    for (let index = 0; index < days.length; index += 1) {
      const resource = await getTrendingResources(days[index][0], days[index][1]); // eslint-disable-line no-await-in-loop
      data.push(resource);
    }
    const filtered = data.map((a) =>
      a.filter((tr: TrendingResource) => tr.affiliation?.toLowerCase() === affiliation),
    );
    res.send(filtered);
  } catch (err) {
    logger().error(
      `api/resources/trending/${req.params.duration}/${req.params.affiliation} failed:`,
      err,
    );
    res.status(500).send({ message: err });
  }
});

export default router;

/**
 * /api/resources
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getResources, getCuratedResources, getCategories } from './modules/dx';
import { asyncTimedFunction } from '../tracer';
import FavoriteResource from './models/favoriteResource';
import logger from '../logger';

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

router.get('/favorites', async (req: Request, res: Response) => {
  try {
    const osuId =
      req.user.groups.includes('masquerade') && req.user.masqueradeId
        ? req.user.masqueradeId
        : req.user.osuId;
    const data = await FavoriteResource.findAll(osuId, true);
    res.send(data);
  } catch (err) {
    logger().error(`api/resources/favorites failed:`, err);
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

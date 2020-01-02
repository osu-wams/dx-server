/**
 * /api/resources
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getResources, getCuratedResources, getCategories } from './modules/dx';
import { asyncTimedFunction } from '../tracer';
import logger from '../logger';

const router = Router();

export interface IResourceResult {
  id: string;
  type: string;
  title: string;
  iconName?: string;
  link: string;
  affiliation: string[];
  audiences: string[];
  categories: string[];
  synonyms: string[];
}

export interface IEntityQueueResourceResult {
  entityQueueTitle: string;
  items: IResourceResult[];
}

export interface ICategory {
  id: string;
  name: string;
  icon: string;
}

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

export default router;

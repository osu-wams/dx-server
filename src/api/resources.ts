/**
 * /api/resources
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getResources, getCategories } from './modules/dx';
import { asyncTimedFunction } from '../tracer';
import logger from '../logger';

const router = Router();

export interface IResourceResult {
  id: string;
  title: string;
  icon?: string;
  uri: string;
  audiences: string[];
}

interface ICategory {
  id: string;
  name: string;
  icon: string;
}

/**
 * Takes an array of API results and filters out unnecessary
 * data for use in the /results?query route.
 * @param data Array of API results
 * @returns Array of filtered results
 */
const filterResults = (data: any): IResourceResult[] => {
  // Map over each element of data returning a new condensed obj.
  return data.map((item: any) => {
    const {
      id,
      attributes: {
        title,
        icon,
        field_service_url: { uri }
      },
      audiences
    } = item;

    return {
      id,
      title,
      icon,
      uri,
      audiences
    };
  });
};

const filterCategories = (data: any): ICategory[] => {
  return data.map((item: any) => {
    const {
      id,
      attributes: { name, icon }
    } = item;

    return {
      id,
      name,
      icon
    };
  });
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(getResources, `getResources`, [req.query]);
    const filteredData = filterResults(data);

    res.send(filteredData);
  } catch (err) {
    logger.error(`api/resources failed:`, err);
    res.status(500).send(err);
  }
});

router.get('/category/:machineName', async (req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(getResources, `getResources:${req.params.machineName}`, [
      req.params
    ]);

    res.send(data);
  } catch (err) {
    logger.error(`api/resources/category/${req.params.machineName} failed:`, err);
    res.status(500).send(err);
  }
});

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const data = await asyncTimedFunction(getCategories, 'getCategories', []);
    const filteredData = filterCategories(data);

    res.send(filteredData);
  } catch (err) {
    logger.error(`api/resources/categories failed:`, err);
    res.status(500).send(err);
  }
});

export default router;

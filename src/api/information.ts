/**
 * /api/info-buttons
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getInfo } from './modules/dx';

const router = Router();

interface IInfoResult {
  id: string;
  title: string;
  content: string;
}

/**
 * Takes an array of API results and filters out unnecessary
 * data for use in the frontend.
 * @param data Array of API results
 * @returns Array of filtered results
 */
const filterResults = (data: any): IInfoResult[] => {
  // Map over each element of data returning a new condensed obj.
  return data.map((item: any) => {
    return {
      id: item.attributes.field_machine_name,
      title: item.attributes.title,
      content: item.attributes.body.processed
    };
  });
};

router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await getInfo();
    const filteredData = filterResults(data);

    res.send(filteredData);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;

/**
 * /api/announcements
 */
import { Router, Request, Response } from 'express';
import logger from '../logger';
import { getAnnouncements } from './modules/dx';
import { asyncTimedFunction } from '../tracer';

const router: Router = Router();

export interface IAnnouncementResult {
  id: string;
  date: null;
  title: string;
  body: string;
  bg_image?: string;
  action: {
    title: string;
    link: string;
  };
  affiliation: string[];
  audiences: string[];
  pages: string[];
}

router.get('{/:page}', async (req: Request, res: Response) => {
  try {
    const result: IAnnouncementResult[] = await asyncTimedFunction(
      getAnnouncements,
      'getAnnouncements',
      []
    );
    if (!(req.params.page === null || req.params.page === undefined) && req.params.page !== '') {
      res.send(
        result.filter(
          r =>
            r.pages.some(p => p.toLowerCase() === String(req.params.page).toLowerCase()) ||
            r.pages.length === 0
        )
      );
    } else {
      res.send(result);
    }
  } catch (err) {
    logger().error(`api/announcements fetching announcements failed: ${err}`);
    res.status(500).send({ message: 'Unable to retrieve announcements.' });
  }
});

export default router;

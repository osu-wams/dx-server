/**
 * /api/announcements
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import {
  getAnnouncements,
  getAcademicAnnouncements,
  getFinancialAnnouncements
} from './modules/dx';
import { asyncTimedFunction } from '../tracer';

const router: Router = Router();

export interface IAnnouncementResult {
  id: string;
  type: string;
  date: null;
  title: string;
  body: string;
  bg_image?: string; // eslint-disable-line camelcase
  action: {
    title: string;
    link: string;
  };
  audiences: string[];
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getAnnouncements, 'getAnnouncements', []);
    res.send(result);
  } catch (err) {
    logger.error(`api/announcements fetching announcements failed: ${err}`);
    res.status(500).send({ message: 'Unable to retrieve announcements.' });
  }
});

router.get('/academic', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(
      getAcademicAnnouncements,
      'getAcademicAnnouncements',
      []
    );
    res.send(result);
  } catch (err) {
    logger.error(`api/announcements/academic fetching academic announcements failed: ${err}`);
    res.status(500).send({ message: 'Unable to retrieve academic announcements.' });
  }
});

router.get('/financial', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(
      getFinancialAnnouncements,
      'getFinancialAnnouncements',
      []
    );
    res.send(result);
  } catch (err) {
    logger.error(`api/announcements/financial fetching financial announcements failed: ${err}`);
    res.status(500).send({ message: 'Unable to retrieve financial announcements.' });
  }
});

export default router;

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
  date: null;
  title: string;
  body: string;
  bg_image?: string; // eslint-disable-line camelcase
  action: {
    title: string;
    link: string;
  };
}

const filterResults = (data: any): IAnnouncementResult[] => {
  return data.map((item: any) => {
    const action = item.attributes.field_announcement_action
      ? {
          title: item.attributes.field_announcement_action.title,
          link: item.attributes.field_announcement_action.uri
        }
      : {
          title: null,
          link: null
        };
    return {
      id: item.id,
      date: null,
      title: item.attributes.title,
      body: item.attributes.field_announcement_body,
      bg_image: item.attributes.background_image,
      action
    };
  });
};

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getAnnouncements, 'getAnnouncements', []);
    const filteredResult = filterResults(result);
    res.send(filteredResult);
  } catch (err) {
    logger.error(`api/announcements fetching announcements failed: ${err}`);
    res.status(500).send('Unable to retrieve announcements.');
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
    res.status(500).send('Unable to retrieve academic announcements.');
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
    res.status(500).send('Unable to retrieve financial announcements.');
  }
});

export default router;

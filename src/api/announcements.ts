/**
 * /api/announcements
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import {
  getAnnouncements,
  getAcademicAnnouncements,
  getFinancialAnnouncements
} from './modules/dx';

const router: Router = Router();

interface IAnnouncementResult {
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
    const result = await getAnnouncements();
    const filteredResult = filterResults(result);
    res.send(filteredResult);
  } catch (err) {
    console.error(`Fetching announcements failed: ${err}`); // eslint-disable-line no-console
    res.status(500).send('Unable to retrieve announcements.');
  }
});

router.get('/academic', async (_req: Request, res: Response) => {
  try {
    const result = await getAcademicAnnouncements();
    res.send(result);
  } catch (err) {
    console.error(`Fetching academic announcements failed: ${err}`); // eslint-disable-line no-console
    res.status(500).send('Unable to retrieve academic announcements.');
  }
});

router.get('/financial', async (_req: Request, res: Response) => {
  try {
    const result = await getFinancialAnnouncements();
    res.send(result);
  } catch (err) {
    console.error(`Fetching financial announcements failed: ${err}`); // eslint-disable-line no-console
    res.status(500).send('Unable to retrieve financial announcements.');
  }
});

export default router;

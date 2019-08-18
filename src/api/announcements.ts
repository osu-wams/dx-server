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

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await getAnnouncements();
    res.send(result);
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

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

const router: Router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await getAnnouncements();
    res.send(result);
  } catch (err) {
    logger.error(`api/announcements fetching announcements failed: ${err}`);
    res.status(500).send('Unable to retrieve announcements.');
  }
});

router.get('/academic', async (_req: Request, res: Response) => {
  try {
    const result = await getAcademicAnnouncements();
    res.send(result);
  } catch (err) {
    logger.error(`api/announcements/academic fetching academic announcements failed: ${err}`);
    res.status(500).send('Unable to retrieve academic announcements.');
  }
});

router.get('/financial', async (_req: Request, res: Response) => {
  try {
    const result = await getFinancialAnnouncements();
    res.send(result);
  } catch (err) {
    logger.error(`api/announcements/financial fetching financial announcements failed: ${err}`);
    res.status(500).send('Unable to retrieve financial announcements.');
  }
});

export default router;

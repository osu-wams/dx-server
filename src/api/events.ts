/**
 * /api/events
 */
import { Router, Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { getEvents, getBendEvents, getAcademicCalendarEvents } from './modules/localist';
import { asyncTimedFunction } from '../tracer';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getEvents, 'getEvents', [req.query]);
    res.send(result);
  } catch (err) {
    logger.error(`api/events failed:`, err);
    res.status(500).send('Unable to retrieve events.');
  }
});

router.get('/bend-events', async (req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getBendEvents, 'getBendEvents', [req.query]);
    res.send(result);
  } catch (err) {
    logger.error(`api/events/bend-events failed:`, err);
    res.status(500).send('Unable to retrieve events.');
  }
});

router.get('/academic-calendar', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(
      getAcademicCalendarEvents,
      'getAcademicCalendarEvents',
      []
    );
    res.send(result);
  } catch (err) {
    logger.error(`api/events/academic-calendar failed:`, err);
    res.status(500).send('Unable to retrieve academic calendar events.');
  }
});

export default router;

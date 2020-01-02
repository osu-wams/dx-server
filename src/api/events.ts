/**
 * /api/events
 */
import { Router, Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import {
  getEvents,
  getCampusEvents,
  getAcademicCalendarEvents,
  getEmployeeEvents,
} from './modules/localist';
import { asyncTimedFunction } from '../tracer';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getEvents, 'getEvents', [req.query]);
    res.send(result);
  } catch (err) {
    logger().error(`api/events failed:`, err);
    res.status(500).send({ message: 'Unable to retrieve events.' });
  }
});

router.get('/campus/:name', async (req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getCampusEvents, 'getCampusEvents', [req.params.name]);
    res.send(result);
  } catch (err) {
    logger().error(`api/events/campus failed:`, err);
    res.status(500).send({ message: 'Unable to retrieve campus events.' });
  }
});

router.get('/academic-calendar', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(
      getAcademicCalendarEvents,
      'getAcademicCalendarEvents',
      [],
    );
    res.send(result);
  } catch (err) {
    logger().error(`api/events/academic-calendar failed:`, err);
    res.status(500).send({ message: 'Unable to retrieve academic calendar events.' });
  }
});

router.get('/employee', async (_req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(getEmployeeEvents, 'getEmployeeEvents', []);
    res.send(result);
  } catch (err) {
    logger().error(`api/events/employee failed:`, err);
    res.status(500).send({ message: 'Unable to retrieve employee events.' });
  }
});

export default router;

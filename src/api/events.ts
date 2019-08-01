/**
 * /api/events
 */
import { Router, Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import { getEvents, getAcademicCalendarEvents } from './modules/localist';

const router: Router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  getEvents(req.query)
    .then(data => res.send(data))
    .catch(err => {
      res.status(500).send('Unable to retrieve events.');
      next(err);
    });
});

router.get('/academic-calendar', (_req: Request, res: Response, next: NextFunction) => {
  getAcademicCalendarEvents()
    .then(data => res.send(data))
    .catch(err => {
      res.status(500).send('Unable to retrieve academic calendar events.');
      next(err);
    });
});

export default router;

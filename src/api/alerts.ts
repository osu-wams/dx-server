/**
 * /api/alerts
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { getAlerts } from './modules/rave-alerts';
import { getDxAlerts } from './modules/dx';
import { asyncTimedFunction } from '../tracer';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(req.session?.id, getAlerts, 'getAlerts', []);
    res.send(result);
  } catch (err) {
    logger.error(`api/alerts failed:`, err);
    res.status(500).send({ message: 'Unable to retrieve rave alerts.' });
  }
});

router.get('/dx', async (req: Request, res: Response) => {
  try {
    const result = await asyncTimedFunction(req.session?.id, getDxAlerts, 'getDxAlerts', []);
    res.send(result);
  } catch (err) {
    logger.error(`api/alerts/dx failed:`, err);
    res.status(500).send({ message: 'Unable to retrieve dx alerts.' });
  }
});

export default router;

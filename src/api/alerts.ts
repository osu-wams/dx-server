/**
 * /api/alerts
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getAlerts } from './modules/rave-alerts';
import { getDxAlerts } from './modules/dx';

const router: Router = Router();

router.get('/', (_req: Request, res: Response) => {
  getAlerts()
    .then((data: any) => res.send(data))
    .catch((err: any) => {
      console.error(`Fetching rave alerts failed: ${err}`); // eslint-disable-line no-console
      res.status(500).send('Unable to rave retrieve alerts.');
    });
});

router.get('/dx', (_req: Request, res: Response) => {
  getDxAlerts()
    .then((data: any) => res.send(data))
    .catch((err: any) => {
      console.error(`Fetching dx alerts failed: ${err}`); // eslint-disable-line no-console
      res.status(500).send('Unable to retrieve dx alerts.');
    });
});

export default router;

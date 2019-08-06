/**
 * /api/alerts
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getAlerts } from './modules/rave-alerts';

const router: Router = Router();

router.get('/', (_req: Request, res: Response) => {
  getAlerts()
    .then((data: any) => res.send(data))
    .catch((err: any) => {
      console.error(`Fetching alerts failed: ${err}`); // eslint-disable-line no-console
      res.status(500).send('Unable to retrieve alerts.');
    });
});

export default router;

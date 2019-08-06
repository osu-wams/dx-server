/**
 * /api/jobs
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { getJobs } from './modules/handshake';

const router: Router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const jobs = await getJobs();
    const corvallisJobs = jobs.jobs.filter(
      (job: any) => job.employment_type_id !== 3 && job.employer.location.city === 'Corvallis'
    );
    const simulateApi = {
      success: true,
      jobs: corvallisJobs
    };
    res.send(simulateApi);
  } catch (err) {
    res.status(500).send('Unable to retrieve jobs.');
  }
});

export default router;

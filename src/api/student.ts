/**
 * /api/student
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import Auth from '../auth';
import { getPlannerItemsMask, getPlannerItemsOAuth, UpcomingAssignment } from './modules/canvas'; // eslint-disable-line no-unused-vars
import {
  getAcademicStatus,
  getAccountBalance,
  getAccountTransactions,
  getClassSchedule,
  getGpa,
  getGrades,
  getHolds
} from './modules/osu';

const router = Router();

interface GradeTerm {
  attributes: {
    term: string;
  };
}

router.get(
  '/planner-items',
  Auth.hasValidCanvasRefreshToken,
  async (req: Request, res: Response) => {
    try {
      let plannerApiResponse: UpcomingAssignment[] = [];
      // Administrators that have masqueraded get access to this endpoint (else you get oauth)
      if (req.user.isAdmin && req.user.masqueradeId) {
        plannerApiResponse = await getPlannerItemsMask(req.user.masqueradeId);
      } else if (req.user.canvasOauthToken) {
        plannerApiResponse = await getPlannerItemsOAuth(req.user.canvasOauthToken);
      }
      res.send(plannerApiResponse);
    } catch (err) {
      console.error('api/student/planner-items failed:', err); // eslint-disable-line no-console
      res.status(500).send('Unable to retrieve planner items.');
    }
  }
);

router.get('/academic-status', async (req: Request, res: Response) => {
  try {
    const term = req.query.term || 'current';
    const response = await getAcademicStatus(req.user, term);
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve academic status.');
  }
});

router.get('/account-balance', async (req: Request, res: Response) => {
  try {
    const response = await getAccountBalance(req.user);
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve account balance.');
  }
});

router.get('/account-transactions', async (req: Request, res: Response) => {
  try {
    const response = await getAccountTransactions(req.user);
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve account transactions');
  }
});

router.get('/class-schedule', async (req: Request, res: Response) => {
  try {
    const term = req.query.term || 'current';
    const response = await getClassSchedule(req.user, term);
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve class schedule.');
  }
});

router.get('/gpa', async (req: Request, res: Response) => {
  try {
    const response = await getGpa(req.user);
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve GPA data.');
  }
});

router.get('/grades', async (req: Request, res: Response) => {
  try {
    const { term } = req.query;
    const response = await getGrades(req.user, term);
    // sort and use sortGradesByTerm to sort banner return newest to oldest
    const sorted = response.data.sort((a: GradeTerm, b: GradeTerm): number => {
      if (!b) return 0;
      if (a.attributes.term < b.attributes.term) return 1;
      if (a.attributes.term > b.attributes.term) return -1;
      return 0;
    });
    res.send(sorted);
  } catch (err) {
    res.status(500).send('Unable to retrieve grades.');
  }
});

router.get('/holds', async (req: Request, res: Response) => {
  try {
    const response = await getHolds(req.user);
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve account holds.');
  }
});

export default router;

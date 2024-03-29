/**
 * /api/student
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Types } from '@osu-wams/lib'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import Auth from '../auth';
import { getPlannerItems } from './modules/canvas'; // eslint-disable-line no-unused-vars
import {
  getAcademicStatus,
  getAccountBalance,
  getAccountTransactions,
  getClassification,
  getClassSchedule,
  getGpa,
  getGrades,
  getHolds,
  getDegrees,
} from './modules/osu';
import { asyncTimedFunction } from '../tracer';
import { setColleges } from './modules/user-account';

const router = Router();

interface GradeTerm {
  attributes: {
    term: string;
  };
}

router.get('/planner-items', Auth.hasCanvasRefreshToken, async (req: Request, res: Response) => {
  try {
    // Administrators that have masqueraded get access to this endpoint (else you get oauth)
    if (req.user.groups.includes('masquerade') && req.user.masqueradeId) {
      const response: string = await asyncTimedFunction(getPlannerItems, 'getPlannerItemsAdmin', [
        { osuId: req.user.masqueradeId },
      ]);
      logger().info('Masqueraded Canvas Planner Items', {
        canvasAction: 'planner-items',
        masqueradeId: req.user.masqueradeId,
        osuId: req.session.passport.user.osuId,
        email: req.session.passport.user.email,
      });
      res.json(JSON.parse(response));
    } else {
      const response: string = await asyncTimedFunction(getPlannerItems, 'getPlannerItemsOAuth', [
        { oAuthToken: req.user.canvasOauthToken },
      ]);
      logger().info('Canvas Planner Items', {
        canvasAction: 'planner-items',
        masqueradeId: '-- OAuth as student --',
        osuId: req.session.passport.user.osuId,
        email: req.session.passport.user.email,
      });
      res.json(JSON.parse(response));
    }
  } catch (err) {
    if (err.response && err.response.statusCode === 401) {
      logger().error(
        `Canvas Planner Items API call failed for user ${req.user.osuId}, error: ${err.message}`,
      );
      req.user.canvasOauthToken = null;
      req.user.canvasOauthExpire = null;
      res.status(403).send({ message: 'Reset users canvas oauth.' });
    } else {
      logger().error('api/student/planner-items failed:', err);
      res.status(500).send({ message: 'Unable to retrieve planner items.' });
    }
  }
});

router.get('/academic-status', async (req: Request, res: Response) => {
  try {
    let termQueryString = '';
    if (req.query.term) termQueryString = `?term=${req.query.term}`;
    const response = await asyncTimedFunction(getAcademicStatus, 'getAcademicStatus', [
      req.user,
      termQueryString,
    ]);
    res.send(response);
  } catch (err) {
    logger().error('api/student/academic-status failed:', err);
    res.status(500).send({ message: 'Unable to retrieve academic status.' });
  }
});

router.get('/account-balance', async (req: Request, res: Response) => {
  try {
    const response = (await asyncTimedFunction(getAccountBalance, 'getAccountBalance', [
      req.user,
    ])) as { data: any };
    res.send(response.data);
  } catch (err) {
    logger().error('api/student/account-balance failed:', err);
    res.status(500).send({ message: 'Unable to retrieve account balance.' });
  }
});

router.get('/account-transactions', async (req: Request, res: Response) => {
  try {
    const response = (await asyncTimedFunction(getAccountTransactions, 'getAccountTransactions', [
      req.user,
    ])) as { data: any };
    res.send(response.data);
  } catch (err) {
    logger().error('api/student/account-transactions failed:', err);
    res.status(500).send({ message: 'Unable to retrieve account transactions.' });
  }
});

router.get('/classification', async (req: Request, res: Response) => {
  try {
    const response = await asyncTimedFunction(getClassification, 'getClassification', [req.user]);
    res.send(response);
  } catch (err) {
    logger().error('api/student/classification failed:', err);
    res.status(500).send({ message: 'Unable to retrieve classification.' });
  }
});

router.get('/class-schedule', async (req: Request, res: Response) => {
  try {
    const term = req.query.term || '';
    const response = (await asyncTimedFunction(getClassSchedule, 'getClassSchedule', [
      req.user,
      term,
    ])) as { data: any };
    res.send(response.data);
  } catch (err) {
    logger().error('api/student/class-schedule failed:', err);
    res.status(500).send({ message: 'Unable to retrieve class schedule.' });
  }
});

router.get('/gpa', async (req: Request, res: Response) => {
  try {
    const response = await asyncTimedFunction(getGpa, 'getGpa', [req.user]);
    res.send(response);
  } catch (err) {
    logger().error('api/student/gpa failed:', err);
    res.status(500).send({ message: 'Unable to retrieve GPA data.' });
  }
});

router.get('/grades', async (req: Request, res: Response) => {
  try {
    const { term } = req.query;
    const grades: GradeTerm[] = await asyncTimedFunction(getGrades, 'getGrades', [req.user, term]);
    // sort and use sortGradesByTerm to sort banner return newest to oldest
    const sorted = grades.sort((a: GradeTerm, b: GradeTerm): number => {
      if (!b) return 0;
      if (a.attributes.term < b.attributes.term) return 1;
      if (a.attributes.term > b.attributes.term) return -1;
      return 0;
    });
    res.send(sorted);
  } catch (err) {
    logger().error('api/student/grades failed:', err);
    res.status(500).send({ message: 'Unable to retrieve grades.' });
  }
});

router.get('/holds', async (req: Request, res: Response) => {
  try {
    const response = await asyncTimedFunction(getHolds, 'getHolds', [req.user]);
    res.send(response);
  } catch (err) {
    logger().error('api/student/holds failed:', err);
    res.status(500).send({ message: 'Unable to retrieve account holds.' });
  }
});

router.get('/degrees', async (req: Request, res: Response) => {
  try {
    const response = await asyncTimedFunction<{ data: Types.DegreeResponse[] }>(
      getDegrees,
      'getDegrees',
      [req.user],
    );
    // If not masqueraded, then upsert this users college(s) to thier user record
    if (!req.user.masqueradeId) {
      const degrees = response.data.map((d) => d.attributes);
      if (degrees.length) {
        const user = await setColleges(req.user, degrees);
        req.session.passport.user = user;
      }
    }

    // If user's degrees contain "in", get rid of it
    if (response.data.length > 0) {
      // @ts-ignore
      response.data.forEach((element, i) => {
        if (response.data[i].attributes.degree.includes(' in')) {
          const degree = response.data[i].attributes.degree.replace(' in', '');
          response.data[i].attributes.degree = degree;
        }
      });
    }

    res.send(response.data);
  } catch (err) {
    logger().error('api/student/degrees failed:', err);
    res.status(500).send({ message: 'Unable to retrieve degree information.' });
  }
});

export default router;

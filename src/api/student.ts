/**
 * /api/student
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import request from 'request-promise';
import config from 'config';
import Auth from '../auth';
import { getToken } from './util';
import { getPlannerItemsMask, getPlannerItemsOAuth, UpcomingAssignment } from './modules/canvas'; // eslint-disable-line no-unused-vars
import Honeycomb from '../honeycomb';

const BASE_URL: string = `${config.get('osuApi.baseUrl')}/students`;
const router = Router();

router.get(
  '/planner-items',
  Auth.hasValidCanvasRefreshToken,
  async (req: Request, res: Response) => {
    try {
      Honeycomb.addContext({
        apiHost: 'canvas',
        apiEndpoint: 'planner-items'
      });
      let plannerApiResponse: UpcomingAssignment[];
      // Administrators that have masqueraded get access to this endpoint (else you get oauth)
      if (req.user.isAdmin && req.user.masqueradeId) {
        plannerApiResponse = await getPlannerItemsMask(req.user.masqueradeId);
      } else if (req.user.canvasOauthToken) {
        plannerApiResponse = await getPlannerItemsOAuth(req.user.canvasOauthToken);
      } else {
        plannerApiResponse = [];
      }

      // Filter out just assignments
      // const assignments = apiResponse.filter(item => item.assignment !== undefined);
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
    const bearerToken = await getToken();
    Honeycomb.addContext({
      apiHost: 'osu',
      apiEndpoint: 'academic-status'
    });
    const apiResponse = await request({
      method: 'GET',
      url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/academic-status?term=${term}`,
      auth: { bearer: bearerToken },
      json: true
    });
    res.send(apiResponse.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve academic status.');
  }
});

router.get('/account-balance', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    Honeycomb.addContext({
      apiHost: 'osu',
      apiEndpoint: 'account-balance'
    });
    const apiResponse = await request({
      method: 'GET',
      url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/account-balance`,
      auth: { bearer: bearerToken },
      json: true
    });
    res.send(apiResponse.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve account balance.');
  }
});

router.get('/account-transactions', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    Honeycomb.addContext({
      apiHost: 'osu',
      apiEndpoint: 'account-transactions'
    });
    const apiResponse = await request({
      method: 'GET',
      url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/account-transactions`,
      auth: { bearer: bearerToken },
      json: true
    });
    res.send(apiResponse.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve account transactions');
  }
});

router.get('/class-schedule', async (req: Request, res: Response) => {
  try {
    const term = req.query.term || 'current';
    const bearerToken = await getToken();
    Honeycomb.addContext({
      apiHost: 'osu',
      apiEndpoint: 'class-schedule'
    });
    const apiResponse = await request({
      method: 'GET',
      url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/class-schedule?term=${term}`,
      auth: { bearer: bearerToken },
      json: true
    });
    res.send(apiResponse.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve class schedule.');
  }
});

router.get('/gpa', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    Honeycomb.addContext({
      apiHost: 'osu',
      apiEndpoint: 'gpa'
    });
    const apiResponse = await request({
      method: 'GET',
      url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/gpa`,
      auth: { bearer: bearerToken },
      json: true
    });
    res.send(apiResponse.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve GPA data.');
  }
});

router.get('/grades', async (req: Request, res: Response) => {
  try {
    const { term } = req.query;
    let termParam = '';
    if (term) {
      termParam = `?term=${term}`;
    }
    const bearerToken = await getToken();
    Honeycomb.addContext({
      apiHost: 'osu',
      apiEndpoint: 'grades'
    });
    const apiResponse = await request({
      method: 'GET',
      url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/grades${termParam}`,
      auth: { bearer: bearerToken },
      json: true
    });
    res.send(apiResponse.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve grades.');
  }
});

router.get('/holds', async (req: Request, res: Response) => {
  try {
    const bearerToken = await getToken();
    Honeycomb.addContext({
      apiHost: 'osu',
      apiEndpoint: 'holds'
    });
    const apiResponse = await request({
      method: 'GET',
      url: `${BASE_URL}/${req.user.masqueradeId || req.user.osuId}/holds`,
      auth: { bearer: bearerToken },
      json: true
    });
    res.send(apiResponse.data);
  } catch (err) {
    res.status(500).send('Unable to retrieve account holds.');
  }
});

export default router;

/**
 * /api/student
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import request from 'request-promise';
import config from 'config';
import { getToken } from './util';
import { getUpcomingAssignments } from './modules/canvas';

const BASE_URL: string = `${config.get('osuApi.baseUrl')}/students`;
const router = Router();

router.get('/assignments', async (req: Request, res: Response) => {
  try {
    const apiResponse = await getUpcomingAssignments(req.user.masqueradeId || req.user.osuId);
    // Filter out just assignments
    const assignments = apiResponse.filter(item => item.assignment !== undefined);
    res.send(assignments);
  } catch (err) {
    res.status(500).send('Unable to retrieve assignments.');
  }
});

router.get('/academic-status', async (req: Request, res: Response) => {
  try {
    const term = req.query.term || 'current';
    const bearerToken = await getToken();
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

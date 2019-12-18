/**
 * /api/admin
 */
import config from 'config';
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import redis from 'redis';
import configsForApi from '../utils/config';
import logger from '../logger';
import User from './models/user';
import cache from './modules/cache';

const router: Router = Router();
const redisClient = redis.createClient({
  host: `${config.get('redis.host')}`,
  port: parseInt(config.get('redis.port'), 10),
});

/**
 * Reset all users sessions, causing them to login with CAS again
 * and specifically enable Canvas oAuth access.
 */
router.get('/reset-sessions', async (req: Request, res: Response) => {
  try {
    const [success, errors] = await User.clearAllCanvasRefreshTokens();
    if (!success) throw new Error(errors);
    // Async call to flush the whole queue, this is a job running on the server and
    // will finish it its own time. Also, this is indiscriminate and flushes everything
    // in the queue. It will need improvement if/when the queue holds keys that
    // deal with things other than user sessions.
    redisClient.flushdb();
    res.status(200).send({ message: 'Tokens reset, session cache is clearing.' });
  } catch (err) {
    logger().error('api/admin/reset-sessions failed:', err);
    res.status(500).send({ message: 'Error while resetting sessions.' });
  }
});

/**
 * Reset all API endpoint caches
 */
router.get('/reset-api-cache', async (req: Request, res: Response) => {
  try {
    const flushed = await cache.flushDb();
    if (flushed) {
      res.status(200).send({ message: 'Api cache is resetting.' });
    } else {
      res.status(304).send();
    }
  } catch (err) {
    logger().error('api/admin/reset-api-cache failed:', err);
    res.status(500).send({ message: 'Error while resetting api cache.' });
  }
});

router.get('/config', async (req: Request, res: Response) => {
  res.status(200).send(configsForApi(req.user.isAdmin));
});

export default router;

/**
 * /api/admin
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import { Pool } from 'promise-mysql'; // eslint-disable-line no-unused-vars
import redis from 'redis';
import { dbQuery, pool } from '../db';

const router: Router = Router();
const redisClient = redis.createClient();

/**
 * Reset all users sessions, causing them to login with CAS again
 * and specifically enable Canvas oAuth access.
 */
router.get('/reset-sessions', async (req: Request, res: Response) => {
  try {
    const dbPool: Pool = await pool;
    await dbPool.query(dbQuery.resetAllRefreshToken);
    // Async call to flush the whole queue, this is a job running on the server and
    // will finish it its own time. Also, this is indiscriminate and flushes everything
    // in the queue. It will need improvement if/when the queue holds keys that
    // deal with things other than user sessions.
    redisClient.flushdb();
    res.status(200).send('Tokens reset, session cache is clearing.');
  } catch (err) {
    console.error('api/admin/reset-sessions failed:', err); // eslint-disable-line no-console
    res.status(500).send('Error while resetting sessions.');
  }
});

export default router;

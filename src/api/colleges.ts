/**
 * /api/colleges
 */
 import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
 import logger from '../logger';
 import { getColleges } from './modules/dx';
 import { asyncTimedFunction } from '../tracer';
 
 const router = Router();
 
 router.get('/', async (_req: Request, res: Response) => {
   try {
     const result = await asyncTimedFunction(getColleges, 'getColleges', []);
     res.send(result);
   } catch (err) {
     logger().error(`api/colleges failed:`, err);
     res.status(500).send({ message: 'Colleges API queries failed.' });
   }
 });

export default router;

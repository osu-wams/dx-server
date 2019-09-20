/**
 * /api/user
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getClassification, Classification } from './modules/osu'; // eslint-disable-line no-unused-vars

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  let classification;
  try {
    const response: Classification = await asyncTimedFunction<Classification>(
      getClassification,
      'getClassification',
      [req.user]
    );
    const { id, attributes } = response;
    classification = { id, attributes };
  } catch (err) {
    logger.error('api/student/classification failed:', err);
  }
  res.send({
    osuId: req.user.osuId,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
    isCanvasOptIn: req.user.isCanvasOptIn,
    classification: classification || undefined
  });
});

export default router;

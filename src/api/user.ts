/**
 * /api/user
 */
import { Router, Request, Response } from 'express'; // eslint-disable-line no-unused-vars
import logger from '../logger';
import { asyncTimedFunction } from '../tracer';
import { getClassification, Classification } from './modules/osu'; // eslint-disable-line no-unused-vars
import User from './models/user'; // eslint-disable-line no-unused-vars

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  res.send({
    osuId: req.user.osuId,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    primaryAffiliation: req.user.primaryAffiliation,
    isAdmin: req.user.isAdmin,
    groups: req.user.groups ?? [],
    isCanvasOptIn: req.user.isCanvasOptIn,
    audienceOverride: req.user.audienceOverride || {},
    classification: req.user.classification || {},
    primaryAffiliationOverride: req.user.primaryAffiliationOverride,
    theme: req.user.theme,
  });
});

router.get('/classification', async (req: Request, res: Response) => {
  let classification = {};
  try {
    const classificationPromise: Promise<Classification> = asyncTimedFunction<Classification>(
      getClassification,
      'getClassification',
      [req.user],
    );
    const { id, attributes } = await classificationPromise;
    classification = { id, attributes };
    req.user.classification = classification;
  } catch (err) {
    logger().error(`api/user/classification failed: ${err.message}, trace: ${err.stack}`);
  }
  res.send(classification);
});

router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { audienceOverride, theme, primaryAffiliationOverride } = req.body;
    const user: User = req.user; // eslint-disable-line prefer-destructuring
    const updatedUser: User = await User.updateSettings(user, {
      audienceOverride,
      primaryAffiliationOverride,
      theme,
    });
    if (audienceOverride !== undefined)
      req.session.passport.user.audienceOverride = updatedUser.audienceOverride;
    if (primaryAffiliationOverride)
      req.session.passport.user.primaryAffiliationOverride = updatedUser.primaryAffiliationOverride;
    if (theme !== undefined) req.session.passport.user.theme = updatedUser.theme;
    res.json({
      audienceOverride: updatedUser.audienceOverride,
      theme: updatedUser.theme,
      primaryAffiliationOverride: updatedUser.primaryAffiliationOverride,
    });
  } catch (err) {
    logger().error('api/user/settings failed:', err);
    res.status(500).send({ message: 'Failed to update users settings.' });
  }
});

export default router;
